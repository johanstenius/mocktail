import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../lib/auth";
import { getAuth } from "../lib/auth";
import {
	type BucketResponse,
	createBucketRoute,
	deleteBucketRoute,
	getBucketRoute,
	listBucketsRoute,
	updateBucketRoute,
} from "../schemas/bucket";
import * as bucketService from "../services/bucket.service";
import type { BucketModel } from "../services/bucket.service";
import * as limitsService from "../services/limits.service";
import * as projectService from "../services/project.service";
import { badRequest, conflict, notFound } from "../utils/errors";

export const bucketsRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

bucketsRouter.use("/*", async (c, next) => {
	const auth = getAuth(c);
	await limitsService.requireFeature(auth.orgId, "statefulMocks");
	await next();
});

function mapBucketToResponse(bucket: BucketModel): BucketResponse {
	return {
		id: bucket.id,
		projectId: bucket.projectId,
		name: bucket.name,
		data: bucket.data,
		createdAt: bucket.createdAt.toISOString(),
		updatedAt: bucket.updatedAt.toISOString(),
	};
}

async function requireProjectAccess(
	c: { req: { valid: (type: "param") => { id: string } } },
	auth: { orgId: string },
) {
	const { id } = c.req.valid("param");
	const project = await projectService.findById(id);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}
	return { project, projectId: id };
}

bucketsRouter.openapi(listBucketsRoute, async (c) => {
	const auth = getAuth(c);
	const { projectId } = await requireProjectAccess(c, auth);
	const buckets = await bucketService.findByProjectId(projectId);
	return c.json({ buckets: buckets.map(mapBucketToResponse) }, 200);
});

bucketsRouter.openapi(getBucketRoute, async (c) => {
	const auth = getAuth(c);
	const { id, name } = c.req.valid("param");
	const project = await projectService.findById(id);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const bucket = await bucketService.findByName(id, name);
	if (!bucket) {
		throw notFound("Bucket");
	}

	return c.json(mapBucketToResponse(bucket), 200);
});

bucketsRouter.openapi(createBucketRoute, async (c) => {
	const auth = getAuth(c);
	const { projectId } = await requireProjectAccess(c, auth);
	const body = c.req.valid("json");

	const result = await bucketService.create(projectId, {
		name: body.name,
		data: body.data,
	});

	if ("error" in result) {
		if (result.error === "bucket_exists") {
			throw conflict("Bucket already exists");
		}
		if (result.error === "invalid_name") {
			throw badRequest("Invalid bucket name");
		}
		throw notFound("Project");
	}

	return c.json(mapBucketToResponse(result.bucket), 201);
});

bucketsRouter.openapi(updateBucketRoute, async (c) => {
	const auth = getAuth(c);
	const { id, name } = c.req.valid("param");
	const project = await projectService.findById(id);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const body = c.req.valid("json");
	const bucket = await bucketService.update(id, name, { data: body.data });

	if (!bucket) {
		throw notFound("Bucket");
	}

	return c.json(mapBucketToResponse(bucket), 200);
});

bucketsRouter.openapi(deleteBucketRoute, async (c) => {
	const auth = getAuth(c);
	const { id, name } = c.req.valid("param");
	const project = await projectService.findById(id);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const deleted = await bucketService.remove(id, name);
	if (!deleted) {
		throw notFound("Bucket");
	}

	return c.body(null, 204);
});
