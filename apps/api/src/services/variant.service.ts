import * as endpointRepo from "../repositories/endpoint.repository";
import * as variantRepo from "../repositories/variant.repository";

export type MatchTarget = "header" | "query" | "param" | "body";
export type MatchOperator =
	| "equals"
	| "not_equals"
	| "contains"
	| "not_contains"
	| "exists"
	| "not_exists";
export type RuleLogic = "and" | "or";

export type MatchRule = {
	target: MatchTarget;
	key: string;
	operator: MatchOperator;
	value?: string;
};

export type VariantModel = {
	id: string;
	endpointId: string;
	name: string;
	priority: number;
	isDefault: boolean;
	status: number;
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
	rules: MatchRule[];
	ruleLogic: RuleLogic;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateVariantInput = {
	name: string;
	isDefault?: boolean;
	status: number;
	headers: Record<string, string>;
	body: unknown;
	bodyType: string;
	delay: number;
	failRate: number;
	rules: MatchRule[];
	ruleLogic: RuleLogic;
};

export type UpdateVariantInput = Partial<CreateVariantInput>;

function dbToModel(
	db: Awaited<ReturnType<typeof variantRepo.findById>>,
): VariantModel | null {
	if (!db) return null;
	return {
		...db,
		rules: JSON.parse(db.rules) as MatchRule[],
		ruleLogic: db.ruleLogic as RuleLogic,
	};
}

function dbListToModels(
	list: Awaited<ReturnType<typeof variantRepo.findByEndpointId>>,
): VariantModel[] {
	return list.map((db) => ({
		...db,
		rules: JSON.parse(db.rules) as MatchRule[],
		ruleLogic: db.ruleLogic as RuleLogic,
	}));
}

export async function findByEndpointId(
	endpointId: string,
): Promise<VariantModel[]> {
	const variants = await variantRepo.findByEndpointId(endpointId);
	return dbListToModels(variants);
}

export async function findById(
	variantId: string,
	endpointId: string,
): Promise<VariantModel | null> {
	const variant = await variantRepo.findByIdAndEndpoint(variantId, endpointId);
	return dbToModel(variant);
}

export async function create(
	endpointId: string,
	input: CreateVariantInput,
): Promise<
	{ variant: VariantModel } | { error: "endpoint_not_found" | "invalid_rules" }
> {
	const endpoint = await endpointRepo.findById(endpointId);
	if (!endpoint) return { error: "endpoint_not_found" };

	const existingCount = await variantRepo.countByEndpointId(endpointId);
	const priority = existingCount;

	const isDefault = input.isDefault ?? existingCount === 0;

	if (isDefault) {
		const existingDefault = await variantRepo.findDefaultByEndpoint(endpointId);
		if (existingDefault) {
			await variantRepo.update(existingDefault.id, { isDefault: false });
		}
	}

	const variant = await variantRepo.create({
		endpointId,
		name: input.name,
		priority,
		isDefault,
		status: input.status,
		headers: JSON.stringify(input.headers),
		body:
			input.bodyType === "template"
				? String(input.body)
				: JSON.stringify(input.body),
		bodyType: input.bodyType,
		delay: input.delay,
		failRate: input.failRate,
		rules: JSON.stringify(input.rules),
		ruleLogic: input.ruleLogic,
	});

	const model = dbToModel(variant);
	if (!model) {
		return { error: "invalid_rules" };
	}
	return { variant: model };
}

export async function update(
	variantId: string,
	endpointId: string,
	input: UpdateVariantInput,
): Promise<VariantModel | null> {
	const existing = await variantRepo.findByIdAndEndpoint(variantId, endpointId);
	if (!existing) return null;

	const bodyType = input.bodyType ?? existing.bodyType;

	if (input.isDefault === true) {
		const existingDefault = await variantRepo.findDefaultByEndpoint(endpointId);
		if (existingDefault && existingDefault.id !== variantId) {
			await variantRepo.update(existingDefault.id, { isDefault: false });
		}
	}

	const variant = await variantRepo.update(variantId, {
		...(input.name !== undefined && { name: input.name }),
		...(input.isDefault !== undefined && { isDefault: input.isDefault }),
		...(input.status !== undefined && { status: input.status }),
		...(input.headers !== undefined && {
			headers: JSON.stringify(input.headers),
		}),
		...(input.body !== undefined && {
			body:
				bodyType === "template"
					? String(input.body)
					: JSON.stringify(input.body),
		}),
		...(input.bodyType !== undefined && { bodyType: input.bodyType }),
		...(input.delay !== undefined && { delay: input.delay }),
		...(input.failRate !== undefined && { failRate: input.failRate }),
		...(input.rules !== undefined && { rules: JSON.stringify(input.rules) }),
		...(input.ruleLogic !== undefined && { ruleLogic: input.ruleLogic }),
	});

	return dbToModel(variant);
}

export async function remove(
	variantId: string,
	endpointId: string,
): Promise<boolean> {
	const existing = await variantRepo.findByIdAndEndpoint(variantId, endpointId);
	if (!existing) return false;

	const count = await variantRepo.countByEndpointId(endpointId);
	if (count <= 1) return false;

	const wasDefault = existing.isDefault;
	await variantRepo.remove(variantId);

	if (wasDefault) {
		const variants = await variantRepo.findByEndpointId(endpointId);
		if (variants.length > 0) {
			await variantRepo.update(variants[0].id, { isDefault: true });
		}
	}

	return true;
}

export async function reorder(
	endpointId: string,
	variantIds: string[],
): Promise<VariantModel[] | null> {
	const existing = await variantRepo.findByEndpointId(endpointId);
	const existingIds = new Set(existing.map((v) => v.id));

	if (!variantIds.every((id) => existingIds.has(id))) {
		return null;
	}

	const updates = variantIds.map((id, index) => ({ id, priority: index }));
	await variantRepo.updatePriorities(updates);

	return findByEndpointId(endpointId);
}
