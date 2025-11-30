import { z } from "@hono/zod-openapi";
import { bodyTypeSchema } from "./endpoint";

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
	failRate: z.number().min(0).max(100).optional(),
	rules: z.array(matchRuleSchema).max(10).optional(),
	ruleLogic: ruleLogicSchema.optional(),
});

export const reorderVariantsSchema = z.object({
	variantIds: z.array(z.string()).min(1),
});

export type VariantResponse = z.infer<typeof variantSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ReorderVariantsInput = z.infer<typeof reorderVariantsSchema>;
