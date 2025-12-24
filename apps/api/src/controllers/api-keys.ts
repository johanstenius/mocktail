import { OpenAPIHono } from "@hono/zod-openapi";
import { type AuthVariables, getAuth } from "../lib/auth";
import {
	createOrgApiKeyRoute,
	createProjectApiKeyRoute,
	deleteOrgApiKeyRoute,
	deleteProjectApiKeyRoute,
	listOrgApiKeysRoute,
	listProjectApiKeysRoute,
} from "../schemas/api-key";
import * as apiKeyService from "../services/api-key.service";
import type { ApiKeyModel } from "../services/api-key.service";
import * as projectService from "../services/project.service";
import { notFound } from "../utils/errors";

export const orgApiKeysRouter = new OpenAPIHono<{ Variables: AuthVariables }>();
export const projectApiKeysRouter = new OpenAPIHono<{
	Variables: AuthVariables;
}>();

function mapApiKeyToResponse(key: ApiKeyModel) {
	return {
		id: key.id,
		key: key.key,
		type: key.type,
		name: key.name,
		orgId: key.orgId,
		projectId: key.projectId,
		lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
		expiresAt: key.expiresAt?.toISOString() ?? null,
		createdAt: key.createdAt.toISOString(),
	};
}

// Org API Keys
orgApiKeysRouter.openapi(listOrgApiKeysRoute, async (c) => {
	const auth = getAuth(c);
	const keys = await apiKeyService.findByOrgId(auth.orgId);
	return c.json({ keys: keys.map(mapApiKeyToResponse) }, 200);
});

orgApiKeysRouter.openapi(createOrgApiKeyRoute, async (c) => {
	const auth = getAuth(c);
	const body = c.req.valid("json");

	const key = await apiKeyService.createOrgKey({
		name: body.name,
		orgId: auth.orgId,
		expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
	});

	return c.json(mapApiKeyToResponse(key), 201);
});

orgApiKeysRouter.openapi(deleteOrgApiKeyRoute, async (c) => {
	const auth = getAuth(c);
	const { keyId } = c.req.valid("param");

	const deleted = await apiKeyService.remove(keyId, auth.orgId);
	if (!deleted) {
		throw notFound("API key");
	}

	return c.body(null, 204);
});

// Project API Keys
projectApiKeysRouter.openapi(listProjectApiKeysRoute, async (c) => {
	const auth = getAuth(c);
	const { projectId } = c.req.valid("param");

	const project = await projectService.findById(projectId);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const keys = await apiKeyService.findByProjectId(projectId);
	return c.json({ keys: keys.map(mapApiKeyToResponse) }, 200);
});

projectApiKeysRouter.openapi(createProjectApiKeyRoute, async (c) => {
	const auth = getAuth(c);
	const { projectId } = c.req.valid("param");
	const body = c.req.valid("json");

	const project = await projectService.findById(projectId);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const key = await apiKeyService.createProjectKey({
		name: body.name,
		orgId: auth.orgId,
		projectId,
		expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
	});

	return c.json(mapApiKeyToResponse(key), 201);
});

projectApiKeysRouter.openapi(deleteProjectApiKeyRoute, async (c) => {
	const auth = getAuth(c);
	const { projectId, keyId } = c.req.valid("param");

	const project = await projectService.findById(projectId);
	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	const deleted = await apiKeyService.remove(keyId, auth.orgId);
	if (!deleted) {
		throw notFound("API key");
	}

	return c.body(null, 204);
});
