import { describe, expect, it } from "vitest";
import { processTemplate } from "./template-engine";

describe("template-engine", () => {
	const baseContext = {
		params: { id: "123", userId: "456" },
		query: { search: "test", limit: "10" },
		headers: { "x-custom": "header-value", "content-type": "application/json" },
		body: { name: "John", nested: { field: "value" } },
	};

	describe("request variables", () => {
		it("interpolates path params", () => {
			const result = processTemplate(
				'{"id": "{{request.params.id}}"}',
				baseContext,
			);
			expect(result).toBe('{"id": "123"}');
		});

		it("interpolates query params", () => {
			const result = processTemplate(
				'{"search": "{{request.query.search}}"}',
				baseContext,
			);
			expect(result).toBe('{"search": "test"}');
		});

		it("interpolates headers", () => {
			const result = processTemplate(
				'{"custom": "{{request.headers.x-custom}}"}',
				baseContext,
			);
			expect(result).toBe('{"custom": "header-value"}');
		});

		it("interpolates body fields", () => {
			const result = processTemplate(
				'{"name": "{{request.body.name}}"}',
				baseContext,
			);
			expect(result).toBe('{"name": "John"}');
		});

		it("handles nested body fields", () => {
			const result = processTemplate(
				'{"field": "{{request.body.nested.field}}"}',
				baseContext,
			);
			expect(result).toBe('{"field": "value"}');
		});
	});

	describe("faker helpers", () => {
		it("generates random uuid", () => {
			const result = processTemplate(
				'{"id": "{{faker_string_uuid}}"}',
				baseContext,
			);
			const parsed = JSON.parse(result);
			expect(parsed.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			);
		});

		it("generates random email", () => {
			const result = processTemplate(
				'{"email": "{{faker_internet_email}}"}',
				baseContext,
			);
			const parsed = JSON.parse(result);
			expect(parsed.email).toContain("@");
		});

		it("generates random name", () => {
			const result = processTemplate(
				'{"name": "{{faker_person_fullName}}"}',
				baseContext,
			);
			const parsed = JSON.parse(result);
			expect(parsed.name.length).toBeGreaterThan(0);
		});

		it("generates random int with max", () => {
			const result = processTemplate(
				'{"count": "{{faker_number_int 100}}"}',
				baseContext,
			);
			const parsed = JSON.parse(result);
			const count = Number(parsed.count);
			expect(count).toBeGreaterThanOrEqual(0);
			expect(count).toBeLessThanOrEqual(100);
		});
	});

	describe("conditionals", () => {
		it("handles if/else with truthy value", () => {
			const result = processTemplate(
				"{{#if request.headers.x-custom}}has-header{{else}}no-header{{/if}}",
				baseContext,
			);
			expect(result).toBe("has-header");
		});

		it("handles if/else with falsy value", () => {
			const result = processTemplate(
				"{{#if request.headers.missing}}has-header{{else}}no-header{{/if}}",
				baseContext,
			);
			expect(result).toBe("no-header");
		});
	});

	describe("combined usage", () => {
		it("handles complex template", () => {
			const template = `{
  "id": "{{request.params.id}}",
  "email": "{{faker_internet_email}}",
  "premium": {{#if request.headers.x-premium}}true{{else}}false{{/if}}
}`;
			const result = processTemplate(template, baseContext);
			const parsed = JSON.parse(result);
			expect(parsed.id).toBe("123");
			expect(parsed.email).toContain("@");
			expect(parsed.premium).toBe(false);
		});
	});
});
