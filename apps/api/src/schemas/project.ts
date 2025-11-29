import { z } from "@hono/zod-openapi";

export const projectSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	apiKey: z.string().nullable(),
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
});

export const updateProjectSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	apiKey: z.string().nullable().optional(),
});

export type ProjectResponse = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
