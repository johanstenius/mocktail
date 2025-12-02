import { describe, expect, it } from "vitest";
import {
	type MatchContext,
	evaluateRule,
	findMatchingVariant,
	getValueByPath,
	matchVariant,
} from "./rule-matcher.service";
import type { MatchRule, VariantModel } from "./variant.service";

describe("getValueByPath", () => {
	it("gets top-level property", () => {
		expect(getValueByPath({ name: "test" }, "name")).toBe("test");
	});

	it("gets nested property", () => {
		expect(
			getValueByPath(
				{ user: { profile: { name: "test" } } },
				"user.profile.name",
			),
		).toBe("test");
	});

	it("returns undefined for missing property", () => {
		expect(getValueByPath({ name: "test" }, "missing")).toBeUndefined();
	});

	it("returns undefined for nested missing property", () => {
		expect(getValueByPath({ user: {} }, "user.profile.name")).toBeUndefined();
	});

	it("returns undefined for null object", () => {
		expect(getValueByPath(null, "name")).toBeUndefined();
	});
});

describe("evaluateRule", () => {
	const baseCtx: MatchContext = {
		params: { id: "123" },
		query: { page: "1", search: "hello world" },
		headers: { "content-type": "application/json", "x-api-key": "secret" },
		body: { user: { name: "John", role: "admin" } },
	};

	describe("equals operator", () => {
		it("matches equal header value", () => {
			const rule: MatchRule = {
				target: "header",
				key: "content-type",
				operator: "equals",
				value: "application/json",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("does not match different value", () => {
			const rule: MatchRule = {
				target: "header",
				key: "content-type",
				operator: "equals",
				value: "text/plain",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});

		it("matches query param", () => {
			const rule: MatchRule = {
				target: "query",
				key: "page",
				operator: "equals",
				value: "1",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("matches path param", () => {
			const rule: MatchRule = {
				target: "param",
				key: "id",
				operator: "equals",
				value: "123",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("matches body property", () => {
			const rule: MatchRule = {
				target: "body",
				key: "user.role",
				operator: "equals",
				value: "admin",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});
	});

	describe("not_equals operator", () => {
		it("matches when values differ", () => {
			const rule: MatchRule = {
				target: "header",
				key: "content-type",
				operator: "not_equals",
				value: "text/plain",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("does not match equal values", () => {
			const rule: MatchRule = {
				target: "header",
				key: "content-type",
				operator: "not_equals",
				value: "application/json",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});
	});

	describe("contains operator", () => {
		it("matches substring", () => {
			const rule: MatchRule = {
				target: "query",
				key: "search",
				operator: "contains",
				value: "hello",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("does not match missing substring", () => {
			const rule: MatchRule = {
				target: "query",
				key: "search",
				operator: "contains",
				value: "goodbye",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});

		it("returns false for undefined value", () => {
			const rule: MatchRule = {
				target: "query",
				key: "missing",
				operator: "contains",
				value: "test",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});
	});

	describe("not_contains operator", () => {
		it("matches when substring missing", () => {
			const rule: MatchRule = {
				target: "query",
				key: "search",
				operator: "not_contains",
				value: "goodbye",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("does not match when substring present", () => {
			const rule: MatchRule = {
				target: "query",
				key: "search",
				operator: "not_contains",
				value: "hello",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});

		it("returns true for undefined value", () => {
			const rule: MatchRule = {
				target: "query",
				key: "missing",
				operator: "not_contains",
				value: "test",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});
	});

	describe("exists operator", () => {
		it("matches when property exists", () => {
			const rule: MatchRule = {
				target: "header",
				key: "x-api-key",
				operator: "exists",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("does not match missing property", () => {
			const rule: MatchRule = {
				target: "header",
				key: "x-missing",
				operator: "exists",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});
	});

	describe("not_exists operator", () => {
		it("matches when property missing", () => {
			const rule: MatchRule = {
				target: "header",
				key: "x-missing",
				operator: "not_exists",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(true);
		});

		it("does not match when property exists", () => {
			const rule: MatchRule = {
				target: "header",
				key: "x-api-key",
				operator: "not_exists",
			};
			expect(evaluateRule(rule, baseCtx)).toBe(false);
		});
	});
});

describe("matchVariant", () => {
	const ctx: MatchContext = {
		params: {},
		query: { type: "admin" },
		headers: { "x-debug": "true" },
		body: {},
	};

	it("returns true for empty rules", () => {
		expect(matchVariant([], "and", ctx)).toBe(true);
	});

	describe("AND logic", () => {
		it("matches when all rules pass", () => {
			const rules: MatchRule[] = [
				{ target: "query", key: "type", operator: "equals", value: "admin" },
				{ target: "header", key: "x-debug", operator: "equals", value: "true" },
			];
			expect(matchVariant(rules, "and", ctx)).toBe(true);
		});

		it("fails when any rule fails", () => {
			const rules: MatchRule[] = [
				{ target: "query", key: "type", operator: "equals", value: "admin" },
				{
					target: "header",
					key: "x-debug",
					operator: "equals",
					value: "false",
				},
			];
			expect(matchVariant(rules, "and", ctx)).toBe(false);
		});
	});

	describe("OR logic", () => {
		it("matches when any rule passes", () => {
			const rules: MatchRule[] = [
				{ target: "query", key: "type", operator: "equals", value: "user" },
				{ target: "header", key: "x-debug", operator: "equals", value: "true" },
			];
			expect(matchVariant(rules, "or", ctx)).toBe(true);
		});

		it("fails when all rules fail", () => {
			const rules: MatchRule[] = [
				{ target: "query", key: "type", operator: "equals", value: "user" },
				{
					target: "header",
					key: "x-debug",
					operator: "equals",
					value: "false",
				},
			];
			expect(matchVariant(rules, "or", ctx)).toBe(false);
		});
	});
});

describe("findMatchingVariant", () => {
	function makeVariant(
		id: string,
		priority: number,
		isDefault: boolean,
		rules: MatchRule[],
	): VariantModel {
		return {
			id,
			endpointId: "ep1",
			name: `Variant ${id}`,
			priority,
			isDefault,
			status: 200,
			headers: {},
			body: {},
			bodyType: "static",
			delay: 0,
			delayType: "fixed",
			failRate: 0,
			rules,
			ruleLogic: "and",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}

	const ctx: MatchContext = {
		params: {},
		query: { type: "admin" },
		headers: {},
		body: {},
	};

	it("returns first matching non-default variant by priority", () => {
		const variants = [
			makeVariant("default", 0, true, []),
			makeVariant("admin", 1, false, [
				{ target: "query", key: "type", operator: "equals", value: "admin" },
			]),
			makeVariant("user", 2, false, [
				{ target: "query", key: "type", operator: "equals", value: "user" },
			]),
		];

		const result = findMatchingVariant(variants, ctx);
		expect(result?.id).toBe("admin");
	});

	it("returns default when no rules match", () => {
		const variants = [
			makeVariant("default", 0, true, []),
			makeVariant("user", 1, false, [
				{ target: "query", key: "type", operator: "equals", value: "user" },
			]),
		];

		const result = findMatchingVariant(variants, ctx);
		expect(result?.id).toBe("default");
	});

	it("returns first variant when no default exists", () => {
		const variants = [
			makeVariant("user", 0, false, [
				{ target: "query", key: "type", operator: "equals", value: "user" },
			]),
			makeVariant("other", 1, false, []),
		];

		const result = findMatchingVariant(variants, ctx);
		expect(result?.id).toBe("other");
	});

	it("respects priority order", () => {
		const variants = [
			makeVariant("low", 10, false, [
				{ target: "query", key: "type", operator: "equals", value: "admin" },
			]),
			makeVariant("high", 1, false, [
				{ target: "query", key: "type", operator: "equals", value: "admin" },
			]),
		];

		const result = findMatchingVariant(variants, ctx);
		expect(result?.id).toBe("high");
	});

	it("returns null for empty variants", () => {
		const result = findMatchingVariant([], ctx);
		expect(result).toBeNull();
	});
});
