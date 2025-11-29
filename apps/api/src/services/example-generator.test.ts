import { describe, expect, it } from "vitest";
import { generateExample } from "./example-generator";

describe("generateExample", () => {
	it("generates string from type", () => {
		const result = generateExample({ type: "string" });
		expect(result).toBe("string");
	});

	it("uses example field if present", () => {
		const result = generateExample({ type: "string", example: "hello" });
		expect(result).toBe("hello");
	});

	it("uses enum first value", () => {
		const result = generateExample({ type: "string", enum: ["a", "b", "c"] });
		expect(result).toBe("a");
	});

	it("generates email for email property name", () => {
		const result = generateExample({
			type: "object",
			properties: { email: { type: "string" } },
		});
		expect(result).toEqual({ email: "user@example.com" });
	});

	it("generates number", () => {
		const result = generateExample({ type: "number" });
		expect(typeof result).toBe("number");
	});

	it("generates integer", () => {
		const result = generateExample({ type: "integer" });
		expect(typeof result).toBe("number");
		expect(Number.isInteger(result)).toBe(true);
	});

	it("generates boolean", () => {
		const result = generateExample({ type: "boolean" });
		expect(typeof result).toBe("boolean");
	});

	it("generates array with items", () => {
		const result = generateExample({
			type: "array",
			items: { type: "string" },
		});
		expect(Array.isArray(result)).toBe(true);
		expect((result as unknown[]).length).toBeGreaterThan(0);
	});

	it("generates object with properties", () => {
		const result = generateExample({
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "integer" },
			},
		});
		expect(result).toEqual({
			name: "John Doe",
			age: 25,
		});
	});

	it("handles nested objects", () => {
		const result = generateExample({
			type: "object",
			properties: {
				user: {
					type: "object",
					properties: {
						id: { type: "integer" },
						email: { type: "string" },
					},
				},
			},
		});
		expect(result).toEqual({
			user: {
				id: 1,
				email: "user@example.com",
			},
		});
	});

	it("handles allOf by merging schemas", () => {
		const result = generateExample({
			allOf: [
				{ type: "object", properties: { a: { type: "string" } } },
				{ type: "object", properties: { b: { type: "number" } } },
			],
		});
		expect(result).toEqual({ a: "string", b: 1 });
	});

	it("handles oneOf by using first option", () => {
		const result = generateExample({
			oneOf: [{ type: "string", example: "first" }, { type: "number" }],
		});
		expect(result).toBe("first");
	});

	it("generates date format correctly", () => {
		const result = generateExample({ type: "string", format: "date" });
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("generates uuid format correctly", () => {
		const result = generateExample({ type: "string", format: "uuid" });
		expect(result).toMatch(/^[0-9a-f-]{36}$/);
	});

	it("respects minimum value for numbers", () => {
		const result = generateExample({ type: "number", minimum: 100 });
		expect(result).toBe(100);
	});
});
