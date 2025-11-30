import { OpenAPIHono } from "@hono/zod-openapi";
import {
	authMiddleware,
	getAuth,
	requireVerifiedEmail,
} from "../middleware/auth";
import { invalidateProjectKeyCache } from "../middleware/mock-auth";
import {
	createProjectRoute,
	deleteProjectRoute,
	getProjectRoute,
	listProjectsRoute,
	rotateKeyRoute,
	updateProjectRoute,
} from "../schemas/project";
import * as limitsService from "../services/limits.service";
import * as projectService from "../services/project.service";
import type { ProjectModel } from "../services/project.service";
import { conflict, notFound } from "../utils/errors";

export const projectsRouter = new OpenAPIHono();

projectsRouter.use("*", authMiddleware(), requireVerifiedEmail());

function mapProjectToResponse(project: ProjectModel) {
	return {
		id: project.id,
		name: project.name,
		slug: project.slug,
		apiKey: project.apiKey,
		createdAt: project.createdAt.toISOString(),
		updatedAt: project.updatedAt.toISOString(),
	};
}

projectsRouter.openapi(listProjectsRoute, async (c) => {
	const auth = getAuth(c);
	const projects = await projectService.findByOrgId(auth.orgId);
	return c.json({ projects: projects.map(mapProjectToResponse) });
});

projectsRouter.openapi(getProjectRoute, async (c) => {
	const auth = getAuth(c);
	const { id } = c.req.valid("param");
	const project = await projectService.findById(id);

	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	return c.json(mapProjectToResponse(project));
});

projectsRouter.openapi(createProjectRoute, async (c) => {
	const auth = getAuth(c);
	const body = c.req.valid("json");

	await limitsService.requireProjectLimit(auth.orgId);

	const existing = await projectService.findBySlugAndOrgId(
		body.slug,
		auth.orgId,
	);
	if (existing) {
		throw conflict("Slug already exists");
	}

	const project = await projectService.create({ ...body, orgId: auth.orgId });
	return c.json(mapProjectToResponse(project), 201);
});

projectsRouter.openapi(updateProjectRoute, async (c) => {
	const auth = getAuth(c);
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");

	const existing = await projectService.findById(id);
	if (!existing || existing.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const project = await projectService.update(id, body);
	if (!project) {
		throw notFound("Project");
	}
	return c.json(mapProjectToResponse(project));
});

projectsRouter.openapi(deleteProjectRoute, async (c) => {
	const auth = getAuth(c);
	const { id } = c.req.valid("param");

	const existing = await projectService.findById(id);
	if (!existing || existing.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	await projectService.remove(id);
	return c.body(null, 204);
});

projectsRouter.openapi(rotateKeyRoute, async (c) => {
	const auth = getAuth(c);
	const { id } = c.req.valid("param");

	const existing = await projectService.findById(id);
	if (!existing || existing.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const oldKey = existing.apiKey;
	const project = await projectService.rotateApiKey(id);
	if (!project) {
		throw notFound("Project");
	}

	invalidateProjectKeyCache(oldKey);

	return c.json(mapProjectToResponse(project));
});
