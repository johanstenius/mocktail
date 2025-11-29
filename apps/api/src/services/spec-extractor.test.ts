import type { OpenAPIV3 } from "openapi-types";
import { describe, expect, it } from "vitest";
import { extractEndpoints } from "./spec-extractor";

function createSpec(paths: OpenAPIV3.PathsObject): OpenAPIV3.Document {
	return {
		openapi: "3.0.0",
		info: { title: "Test", version: "1.0.0" },
		paths,
	};
}

describe("extractEndpoints", () => {
	it("extracts GET endpoint", () => {
		const spec = createSpec({
			"/users": {
				get: {
					responses: {
						200: {
							description: "OK",
							content: {
								"application/json": {
									schema: { type: "array", items: { type: "string" } },
								},
							},
						},
					},
				},
			},
		});

		const result = extractEndpoints(spec);
		expect(result).toHaveLength(1);
		expect(result[0].method).toBe("GET");
		expect(result[0].path).toBe("/users");
		expect(result[0].status).toBe(200);
	});

	it("converts OpenAPI path params to Express format", () => {
		const spec = createSpec({
			"/users/{id}": {
				get: {
					responses: { 200: { description: "OK" } },
				},
			},
		});

		const result = extractEndpoints(spec);
		expect(result[0].path).toBe("/users/:id");
	});

	it("extracts multiple methods from same path", () => {
		const spec = createSpec({
			"/users": {
				get: { responses: { 200: { description: "List" } } },
				post: { responses: { 201: { description: "Created" } } },
			},
		});

		const result = extractEndpoints(spec);
		expect(result).toHaveLength(2);
		expect(result.map((e) => e.method).sort()).toEqual(["GET", "POST"]);
	});

	it("uses 201 status for POST when available", () => {
		const spec = createSpec({
			"/users": {
				post: {
					responses: {
						201: { description: "Created" },
						400: { description: "Bad Request" },
					},
				},
			},
		});

		const result = extractEndpoints(spec);
		expect(result[0].status).toBe(201);
	});

	it("extracts example from content", () => {
		const spec = createSpec({
			"/users": {
				get: {
					responses: {
						200: {
							description: "OK",
							content: {
								"application/json": {
									example: { id: 1, name: "Test" },
									schema: { type: "object" },
								},
							},
						},
					},
				},
			},
		});

		const result = extractEndpoints(spec);
		expect(result[0].body).toEqual({ id: 1, name: "Test" });
	});

	it("generates body from schema when no example", () => {
		const spec = createSpec({
			"/users": {
				get: {
					responses: {
						200: {
							description: "OK",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											id: { type: "integer" },
											email: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
		});

		const result = extractEndpoints(spec);
		expect(result[0].body).toHaveProperty("id");
		expect(result[0].body).toHaveProperty("email");
	});

	it("handles multiple path params", () => {
		const spec = createSpec({
			"/users/{userId}/posts/{postId}": {
				get: { responses: { 200: { description: "OK" } } },
			},
		});

		const result = extractEndpoints(spec);
		expect(result[0].path).toBe("/users/:userId/posts/:postId");
	});

	it("returns empty array for empty paths", () => {
		const spec = createSpec({});
		const result = extractEndpoints(spec);
		expect(result).toEqual([]);
	});

	it("skips unsupported methods like OPTIONS", () => {
		const spec = createSpec({
			"/users": {
				options: { responses: { 200: { description: "OK" } } },
			},
		});

		const result = extractEndpoints(spec);
		expect(result).toHaveLength(0);
	});
});
