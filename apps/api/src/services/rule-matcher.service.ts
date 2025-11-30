import type { MatchRule, RuleLogic, VariantModel } from "./variant.service";

export type MatchContext = {
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string>;
	body: unknown;
};

function getValueByPath(obj: unknown, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = obj;
	for (const part of parts) {
		if (current === null || current === undefined) return undefined;
		if (typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

function evaluateRule(rule: MatchRule, ctx: MatchContext): boolean {
	let value: unknown;

	switch (rule.target) {
		case "header":
			value = ctx.headers[rule.key.toLowerCase()];
			break;
		case "query":
			value = ctx.query[rule.key];
			break;
		case "param":
			value = ctx.params[rule.key];
			break;
		case "body":
			value = getValueByPath(ctx.body, rule.key);
			break;
	}

	switch (rule.operator) {
		case "exists":
			return value !== undefined && value !== null;
		case "not_exists":
			return value === undefined || value === null;
		case "equals":
			return String(value) === rule.value;
		case "not_equals":
			return String(value) !== rule.value;
		case "contains":
			if (value === undefined || value === null) return false;
			return String(value).includes(rule.value ?? "");
		case "not_contains":
			if (value === undefined || value === null) return true;
			return !String(value).includes(rule.value ?? "");
	}
}

function matchVariant(
	rules: MatchRule[],
	ruleLogic: RuleLogic,
	ctx: MatchContext,
): boolean {
	if (rules.length === 0) return true;

	if (ruleLogic === "and") {
		return rules.every((rule) => evaluateRule(rule, ctx));
	}
	return rules.some((rule) => evaluateRule(rule, ctx));
}

export function findMatchingVariant(
	variants: VariantModel[],
	ctx: MatchContext,
): VariantModel | null {
	const sorted = [...variants].sort((a, b) => a.priority - b.priority);

	for (const variant of sorted) {
		if (
			!variant.isDefault &&
			matchVariant(variant.rules, variant.ruleLogic, ctx)
		) {
			return variant;
		}
	}

	return sorted.find((v) => v.isDefault) ?? sorted[0] ?? null;
}

export { evaluateRule, matchVariant, getValueByPath };
