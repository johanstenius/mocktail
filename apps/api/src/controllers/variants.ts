import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import { authMiddleware, requireVerifiedEmail } from "../middleware/auth";
import {
	createVariantRoute,
	deleteVariantRoute,
	getVariantRoute,
	listVariantsRoute,
	reorderVariantsRoute,
	updateVariantRoute,
} from "../schemas/variant";
import * as variantService from "../services/variant.service";
import type { VariantModel } from "../services/variant.service";
import { badRequest, notFound } from "../utils/errors";

export const variantsRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

variantsRouter.use("*", authMiddleware(), requireVerifiedEmail());

function parseJson(str: string): unknown {
	try {
		return JSON.parse(str);
	} catch {
		return {};
	}
}

function mapVariantToResponse(variant: VariantModel) {
	return {
		id: variant.id,
		endpointId: variant.endpointId,
		name: variant.name,
		priority: variant.priority,
		isDefault: variant.isDefault,
		status: variant.status,
		headers: parseJson(variant.headers) as Record<string, string>,
		body:
			variant.bodyType === "template" ? variant.body : parseJson(variant.body),
		bodyType: variant.bodyType as "static" | "template",
		delay: variant.delay,
		failRate: variant.failRate,
		rules: variant.rules,
		ruleLogic: variant.ruleLogic,
		requestBodySchema: variant.requestBodySchema
			? parseJson(variant.requestBodySchema)
			: null,
		validationMode: variant.validationMode ?? ("none" as const),
		createdAt: variant.createdAt.toISOString(),
		updatedAt: variant.updatedAt.toISOString(),
	};
}

variantsRouter.openapi(listVariantsRoute, async (c) => {
	const { endpointId } = c.req.valid("param");
	const variants = await variantService.findByEndpointId(endpointId);
	return c.json({ variants: variants.map(mapVariantToResponse) }, 200);
});

// @ts-expect-error - OpenAPI response schema typing issue
variantsRouter.openapi(getVariantRoute, async (c) => {
	const { endpointId, variantId } = c.req.valid("param");
	const variant = await variantService.findById(variantId, endpointId);

	if (!variant) {
		throw notFound("Variant");
	}

	return c.json(mapVariantToResponse(variant), 200);
});

// @ts-expect-error - OpenAPI response schema typing issue
variantsRouter.openapi(createVariantRoute, async (c) => {
	const { endpointId } = c.req.valid("param");
	const body = c.req.valid("json");

	const result = await variantService.create(endpointId, {
		name: body.name,
		isDefault: body.isDefault,
		status: body.status,
		headers: body.headers,
		body: body.body,
		bodyType: body.bodyType,
		delay: body.delay,
		failRate: body.failRate,
		rules: body.rules,
		ruleLogic: body.ruleLogic,
	});

	if ("error" in result) {
		if (result.error === "endpoint_not_found") {
			throw notFound("Endpoint");
		}
		throw badRequest(result.error);
	}

	return c.json(mapVariantToResponse(result.variant), 201);
});

// @ts-expect-error - OpenAPI response schema typing issue
variantsRouter.openapi(updateVariantRoute, async (c) => {
	const { endpointId, variantId } = c.req.valid("param");
	const body = c.req.valid("json");

	const variant = await variantService.update(variantId, endpointId, body);

	if (!variant) {
		throw notFound("Variant");
	}

	return c.json(mapVariantToResponse(variant), 200);
});

variantsRouter.openapi(deleteVariantRoute, async (c) => {
	const { endpointId, variantId } = c.req.valid("param");

	const deleted = await variantService.remove(variantId, endpointId);
	if (!deleted) {
		throw badRequest("Cannot delete last variant or variant not found");
	}

	return c.body(null, 204);
});

variantsRouter.openapi(reorderVariantsRoute, async (c) => {
	const { endpointId } = c.req.valid("param");
	const { variantIds } = c.req.valid("json");

	const variants = await variantService.reorder(endpointId, variantIds);

	if (!variants) {
		throw badRequest("Invalid variant IDs");
	}

	return c.json({ variants: variants.map(mapVariantToResponse) }, 200);
});
