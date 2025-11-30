import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { authMiddleware, getAuth } from "../middleware/auth";
import { invalidateProjectKeyCache } from "../middleware/mock-auth";
import { errorSchema, idParamSchema } from "../schemas/common";
import {
	createProjectSchema,
	projectSchema,
	updateProjectSchema,
} from "../schemas/project";
import * as limitsService from "../services/limits.service";
import * as projectService from "../services/project.service";
import type { ProjectModel } from "../services/project.service";
import { conflict, notFound, quotaExceeded } from "../utils/errors";

export const projectsRouter = new OpenAPIHono();

projectsRouter.use("*", authMiddleware());

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

// List projects
const listRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Projects"],
	responses: {
		200: {
			description: "List of projects",
			content: {
				"application/json": {
					schema: z.object({ projects: z.array(projectSchema) }),
				},
			},
		},
	},
});

projectsRouter.openapi(listRoute, async (c) => {
	const auth = getAuth(c);
	const projects = await projectService.findByOrgId(auth.orgId);
	return c.json({ projects: projects.map(mapProjectToResponse) });
});

// Get project by ID
const getRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Projects"],
	request: {
		params: idParamSchema,
	},
	responses: {
		200: {
			description: "Project details",
			content: {
				"application/json": {
					schema: projectSchema,
				},
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

projectsRouter.openapi(getRoute, async (c) => {
	const auth = getAuth(c);
	const { id } = c.req.valid("param");
	const project = await projectService.findById(id);

	if (!project || project.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	return c.json(mapProjectToResponse(project));
});

// Create project
const createProjectRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Projects"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: createProjectSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Project created",
			content: {
				"application/json": {
					schema: projectSchema,
				},
			},
		},
		409: {
			description: "Slug already exists",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

projectsRouter.openapi(createProjectRoute, async (c) => {
	const auth = getAuth(c);
	const body = c.req.valid("json");

	const limitCheck = await limitsService.checkProjectLimit(auth.orgId);
	if (!limitCheck.allowed) {
		throw quotaExceeded(limitCheck.reason ?? "Project limit reached");
	}

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

// Update project
const updateRoute = createRoute({
	method: "patch",
	path: "/{id}",
	tags: ["Projects"],
	request: {
		params: idParamSchema,
		body: {
			content: {
				"application/json": {
					schema: updateProjectSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Project updated",
			content: {
				"application/json": {
					schema: projectSchema,
				},
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

projectsRouter.openapi(updateRoute, async (c) => {
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

// Delete project
const deleteRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags: ["Projects"],
	request: {
		params: idParamSchema,
	},
	responses: {
		204: {
			description: "Project deleted",
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

projectsRouter.openapi(deleteRoute, async (c) => {
	const auth = getAuth(c);
	const { id } = c.req.valid("param");

	const existing = await projectService.findById(id);
	if (!existing || existing.orgId !== auth.orgId) {
		throw notFound("Project");
	}

	await projectService.remove(id);
	return c.body(null, 204);
});

// Rotate API key
const rotateKeyRoute = createRoute({
	method: "post",
	path: "/{id}/rotate-key",
	tags: ["Projects"],
	request: {
		params: idParamSchema,
	},
	responses: {
		200: {
			description: "API key rotated",
			content: {
				"application/json": {
					schema: projectSchema,
				},
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
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
