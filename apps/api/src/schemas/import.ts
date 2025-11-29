import { z } from "@hono/zod-openapi";
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

export type ImportSpecInput = z.infer<typeof importSpecSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
