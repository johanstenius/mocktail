import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { errorSchema, projectIdParamSchema } from "../schemas/common";
import { importResultSchema, importSpecSchema } from "../schemas/import";
import * as importService from "../services/import.service";
import type { ImportedEndpoint } from "../services/import.service";

export const importRouter = new OpenAPIHono();

function parseJson(str: string): unknown {
	try {
		return JSON.parse(str);
	} catch {
		return {};
	}
}

function mapEndpointToResponse(endpoint: ImportedEndpoint) {
	return {
		id: endpoint.id,
		projectId: endpoint.projectId,
		method: endpoint.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
		path: endpoint.path,
		status: endpoint.status,
		headers: parseJson(endpoint.headers) as Record<string, string>,
		body:
			endpoint.bodyType === "template"
				? endpoint.body
				: parseJson(endpoint.body),
		bodyType: endpoint.bodyType as "static" | "template",
		delay: endpoint.delay,
		failRate: endpoint.failRate,
		createdAt: endpoint.createdAt.toISOString(),
		updatedAt: endpoint.updatedAt.toISOString(),
	};
}

const importRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Import"],
	request: {
		params: projectIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: importSpecSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Import result",
			content: {
				"application/json": {
					schema: importResultSchema,
				},
			},
		},
		400: {
			description: "Invalid spec",
			content: {
				"application/json": {
					schema: errorSchema,
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

importRouter.openapi(importRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const { spec, options } = c.req.valid("json");

	const result = await importService.importSpec(projectId, spec, options);

	if (!result.success) {
		if (result.error === "project_not_found") {
			return c.json({ error: "not_found", message: "Project not found" }, 404);
		}
		return c.json(
			{ error: "invalid_spec", message: result.message ?? "Invalid spec" },
			400,
		);
	}

	return c.json({
		created: result.created,
		skipped: result.skipped,
		endpoints: result.endpoints.map(mapEndpointToResponse),
	});
});
