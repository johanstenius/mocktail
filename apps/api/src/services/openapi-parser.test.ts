import { describe, expect, it } from "vitest";
import { parseSpec } from "./openapi-parser";

const validSpec = {
	openapi: "3.0.0",
	info: { title: "Test API", version: "1.0.0" },
	paths: {
		"/users": {
			get: {
				responses: { 200: { description: "OK" } },
			},
		},
	},
};

const validYamlSpec = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /users:
    get:
      responses:
        "200":
          description: OK
`;

describe("parseSpec", () => {
	it("parses valid JSON object", async () => {
		const result = await parseSpec(validSpec);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.spec.openapi).toBe("3.0.0");
		}
	});

	it("parses valid JSON string", async () => {
		const result = await parseSpec(JSON.stringify(validSpec));
		expect(result.success).toBe(true);
	});

	it("parses valid YAML string", async () => {
		const result = await parseSpec(validYamlSpec);
		expect(result.success).toBe(true);
	});

	it("returns error for invalid JSON", async () => {
		const result = await parseSpec("{ invalid json }");
		expect(result.success).toBe(false);
	});

	it("returns error for invalid spec structure", async () => {
		const result = await parseSpec({ foo: "bar" });
		expect(result.success).toBe(false);
	});

	it("returns error for Swagger 2.0", async () => {
		const swagger2 = {
			swagger: "2.0",
			info: { title: "Test", version: "1.0" },
			paths: {},
		};
		const result = await parseSpec(swagger2);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("OpenAPI 3.x");
		}
	});
});
