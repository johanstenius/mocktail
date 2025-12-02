import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, idParamSchema } from "./shared";

export const projectSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	apiKey: z.string().nullable(),
	proxyBaseUrl: z.string().nullable(),
	proxyTimeout: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const createProjectSchema = z.object({
	name: z.string().min(1).max(100),
	slug: z
		.string()
		.min(1)
		.max(50)
		.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
	proxyBaseUrl: z.string().url().nullable().optional(),
	proxyTimeout: z.number().int().min(1000).max(120000).optional(),
});

export const updateProjectSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	apiKey: z.string().nullable().optional(),
	proxyBaseUrl: z.string().url().nullable().optional(),
	proxyTimeout: z.number().int().min(1000).max(120000).optional(),
});

export const projectListSchema = z.object({
	projects: z.array(projectSchema),
});

// Route definitions
export const listProjectsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Projects"],
	responses: {
		200: {
			description: "List of projects",
			content: {
				"application/json": { schema: projectListSchema },
			},
		},
	},
});

export const getProjectRoute = createRoute({
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
				"application/json": { schema: projectSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const createProjectRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Projects"],
	request: {
		body: {
			content: {
				"application/json": { schema: createProjectSchema },
			},
		},
	},
	responses: {
		201: {
			description: "Project created",
			content: {
				"application/json": { schema: projectSchema },
			},
		},
		409: {
			description: "Slug already exists",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const updateProjectRoute = createRoute({
	method: "patch",
	path: "/{id}",
	tags: ["Projects"],
	request: {
		params: idParamSchema,
		body: {
			content: {
				"application/json": { schema: updateProjectSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Project updated",
			content: {
				"application/json": { schema: projectSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const deleteProjectRoute = createRoute({
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
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const rotateKeyRoute = createRoute({
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
				"application/json": { schema: projectSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type ProjectResponse = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
