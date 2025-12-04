import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../lib/auth";
import { importRoute } from "../schemas/import";
import * as importService from "../services/import.service";
import type { ImportedEndpoint } from "../services/import.service";
import { badRequest, notFound } from "../utils/errors";

export const importRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

function mapEndpointToResponse(endpoint: ImportedEndpoint) {
	return {
		id: endpoint.id,
		projectId: endpoint.projectId,
		method: endpoint.method,
		path: endpoint.path,
		createdAt: endpoint.createdAt.toISOString(),
		updatedAt: endpoint.updatedAt.toISOString(),
	};
}

importRouter.openapi(importRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const { spec, options } = c.req.valid("json");

	const result = await importService.importSpec(projectId, spec, options);

	if (!result.success) {
		if (result.error === "project_not_found") {
			throw notFound("Project");
		}
		throw badRequest(result.message ?? "Invalid spec");
	}

	return c.json(
		{
			created: result.created,
			skipped: result.skipped,
			endpoints: result.endpoints.map(mapEndpointToResponse),
		},
		200,
	);
});
