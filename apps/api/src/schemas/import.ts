import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, projectIdParamSchema } from "./common";
import { endpointSchema } from "./endpoint";

export const importSpecSchema = z.object({
	spec: z.union([z.string(), z.record(z.unknown())]),
	options: z
		.object({
			overwrite: z.boolean().default(false),
		})
		.optional(),
});

export const importResultSchema = z.object({
	created: z.number(),
	skipped: z.number(),
	endpoints: z.array(endpointSchema),
});

// Route definitions
export const importRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Import"],
	request: {
		params: projectIdParamSchema,
		body: {
			content: {
				"application/json": { schema: importSpecSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Import result",
			content: {
				"application/json": { schema: importResultSchema },
			},
		},
		400: {
			description: "Invalid spec",
			content: {
				"application/json": { schema: errorSchema },
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

export type ImportSpecInput = z.infer<typeof importSpecSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
