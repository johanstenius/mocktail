import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
	endpointIdParamSchema,
	errorSchema,
	variantIdParamSchema,
} from "../schemas/common";
import {
	createVariantSchema,
	reorderVariantsSchema,
	updateVariantSchema,
	variantSchema,
} from "../schemas/variant";
import * as variantService from "../services/variant.service";
import type { VariantModel } from "../services/variant.service";
import { badRequest, notFound } from "../utils/errors";

export const variantsRouter = new OpenAPIHono();

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
		createdAt: variant.createdAt.toISOString(),
		updatedAt: variant.updatedAt.toISOString(),
	};
}

// List variants for endpoint
const listRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Variants"],
	request: {
		params: endpointIdParamSchema,
	},
	responses: {
		200: {
			description: "List of response variants",
			content: {
				"application/json": {
					schema: z.object({ variants: z.array(variantSchema) }),
				},
			},
		},
	},
});

variantsRouter.openapi(listRoute, async (c) => {
	const { endpointId } = c.req.valid("param");
	const variants = await variantService.findByEndpointId(endpointId);
	return c.json({ variants: variants.map(mapVariantToResponse) });
});

// Get variant by ID
const getRoute = createRoute({
	method: "get",
	path: "/{variantId}",
	tags: ["Variants"],
	request: {
		params: variantIdParamSchema,
	},
	responses: {
		200: {
			description: "Variant details",
			content: {
				"application/json": {
					schema: variantSchema,
				},
			},
		},
		404: {
			description: "Variant not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

variantsRouter.openapi(getRoute, async (c) => {
	const { endpointId, variantId } = c.req.valid("param");
	const variant = await variantService.findById(variantId, endpointId);

	if (!variant) {
		throw notFound("Variant");
	}

	return c.json(mapVariantToResponse(variant));
});

// Create variant
const createVariantRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Variants"],
	request: {
		params: endpointIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: createVariantSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Variant created",
			content: {
				"application/json": {
					schema: variantSchema,
				},
			},
		},
		404: {
			description: "Endpoint not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

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

// Update variant
const updateRoute = createRoute({
	method: "patch",
	path: "/{variantId}",
	tags: ["Variants"],
	request: {
		params: variantIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: updateVariantSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Variant updated",
			content: {
				"application/json": {
					schema: variantSchema,
				},
			},
		},
		404: {
			description: "Variant not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

variantsRouter.openapi(updateRoute, async (c) => {
	const { endpointId, variantId } = c.req.valid("param");
	const body = c.req.valid("json");

	const variant = await variantService.update(variantId, endpointId, body);

	if (!variant) {
		throw notFound("Variant");
	}

	return c.json(mapVariantToResponse(variant));
});

// Delete variant
const deleteRoute = createRoute({
	method: "delete",
	path: "/{variantId}",
	tags: ["Variants"],
	request: {
		params: variantIdParamSchema,
	},
	responses: {
		204: {
			description: "Variant deleted",
		},
		400: {
			description: "Cannot delete last variant",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
		404: {
			description: "Variant not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

variantsRouter.openapi(deleteRoute, async (c) => {
	const { endpointId, variantId } = c.req.valid("param");

	const deleted = await variantService.remove(variantId, endpointId);
	if (!deleted) {
		throw badRequest("Cannot delete last variant or variant not found");
	}

	return c.body(null, 204);
});

// Reorder variants
const reorderRoute = createRoute({
	method: "post",
	path: "/reorder",
	tags: ["Variants"],
	request: {
		params: endpointIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: reorderVariantsSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Variants reordered",
			content: {
				"application/json": {
					schema: z.object({ variants: z.array(variantSchema) }),
				},
			},
		},
		400: {
			description: "Invalid variant IDs",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

variantsRouter.openapi(reorderRoute, async (c) => {
	const { endpointId } = c.req.valid("param");
	const { variantIds } = c.req.valid("json");

	const variants = await variantService.reorder(endpointId, variantIds);

	if (!variants) {
		throw badRequest("Invalid variant IDs");
	}

	return c.json({ variants: variants.map(mapVariantToResponse) });
});
