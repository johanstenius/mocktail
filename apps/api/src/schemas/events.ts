import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema } from "./shared";

export const eventScopeSchema = z.enum(["project", "org", "user"]);

export const eventsParamSchema = z.object({
	scope: eventScopeSchema,
	scopeId: z.string(),
});

export const eventsQuerySchema = z.object({
	token: z.string().describe("JWT access token for authentication"),
});

export const sseEventSchema = z.object({
	type: z.string(),
	scope: eventScopeSchema,
	scopeId: z.string(),
	payload: z.unknown(),
	timestamp: z.string(),
});

export const subscribeEventsRoute = createRoute({
	method: "get",
	path: "/:scope/:scopeId",
	tags: ["Events"],
	description: "Subscribe to real-time events via Server-Sent Events",
	request: {
		params: eventsParamSchema,
		query: eventsQuerySchema,
	},
	responses: {
		200: {
			description: "SSE event stream",
			content: {
				"text/event-stream": {
					schema: z.string(),
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
		403: {
			description: "Forbidden - no access to this scope",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type EventScope = z.infer<typeof eventScopeSchema>;
