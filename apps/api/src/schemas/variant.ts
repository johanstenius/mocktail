import { createRoute, z } from "@hono/zod-openapi";
import { bodyTypeSchema } from "./endpoint";
import {
	endpointIdParamSchema,
	errorSchema,
	variantIdParamSchema,
} from "./shared";

export const matchTargetSchema = z.enum(["header", "query", "param", "body"]);

export const matchOperatorSchema = z.enum([
	"equals",
	"not_equals",
	"contains",
	"not_contains",
	"exists",
	"not_exists",
]);

export const matchRuleSchema = z.object({
	target: matchTargetSchema,
	key: z.string().min(1),
	operator: matchOperatorSchema,
	value: z.string().optional(),
});

export const ruleLogicSchema = z.enum(["and", "or"]);

export const delayTypeSchema = z.enum(["fixed", "random"]);

export const variantSchema = z.object({
	id: z.string(),
	endpointId: z.string(),
	name: z.string(),
	priority: z.number(),
	isDefault: z.boolean(),
	status: z.number(),
	headers: z.record(z.string()),
	body: z.unknown(),
	bodyType: bodyTypeSchema,
	delay: z.number(),
	delayType: delayTypeSchema,
	failRate: z.number(),
	rules: z.array(matchRuleSchema),
	ruleLogic: ruleLogicSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const createVariantSchema = z.object({
	name: z.string().min(1).max(50).default("Variant"),
	isDefault: z.boolean().default(false),
	status: z.number().min(100).max(599).default(200),
	headers: z.record(z.string()).default({}),
	body: z.unknown().default({}),
	bodyType: bodyTypeSchema.default("static"),
	delay: z.number().min(0).max(30000).default(0),
	delayType: delayTypeSchema.default("fixed"),
	failRate: z.number().min(0).max(100).default(0),
	rules: z.array(matchRuleSchema).max(10).default([]),
	ruleLogic: ruleLogicSchema.default("and"),
});

export const updateVariantSchema = z.object({
	name: z.string().min(1).max(50).optional(),
	isDefault: z.boolean().optional(),
	status: z.number().min(100).max(599).optional(),
	headers: z.record(z.string()).optional(),
	body: z.unknown().optional(),
	bodyType: bodyTypeSchema.optional(),
	delay: z.number().min(0).max(30000).optional(),
	delayType: delayTypeSchema.optional(),
	failRate: z.number().min(0).max(100).optional(),
	rules: z.array(matchRuleSchema).max(10).optional(),
	ruleLogic: ruleLogicSchema.optional(),
});

export const reorderVariantsSchema = z.object({
	variantIds: z.array(z.string()).min(1),
});

export const variantListSchema = z.object({
	variants: z.array(variantSchema),
});

// Route definitions
export const listVariantsRoute = createRoute({
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
				"application/json": { schema: variantListSchema },
			},
		},
	},
});

export const getVariantRoute = createRoute({
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
				"application/json": { schema: variantSchema },
			},
		},
	},
});

export const createVariantRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Variants"],
	request: {
		params: endpointIdParamSchema,
		body: {
			content: {
				"application/json": { schema: createVariantSchema },
			},
		},
	},
	responses: {
		201: {
			description: "Variant created",
			content: {
				"application/json": { schema: variantSchema },
			},
		},
	},
});

export const updateVariantRoute = createRoute({
	method: "patch",
	path: "/{variantId}",
	tags: ["Variants"],
	request: {
		params: variantIdParamSchema,
		body: {
			content: {
				"application/json": { schema: updateVariantSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Variant updated",
			content: {
				"application/json": { schema: variantSchema },
			},
		},
	},
});

export const deleteVariantRoute = createRoute({
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
	},
});

export const reorderVariantsRoute = createRoute({
	method: "post",
	path: "/reorder",
	tags: ["Variants"],
	request: {
		params: endpointIdParamSchema,
		body: {
			content: {
				"application/json": { schema: reorderVariantsSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Variants reordered",
			content: {
				"application/json": { schema: variantListSchema },
			},
		},
	},
});

export type VariantResponse = z.infer<typeof variantSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ReorderVariantsInput = z.infer<typeof reorderVariantsSchema>;
