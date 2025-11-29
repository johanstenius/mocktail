import type { OpenAPIV3 } from "openapi-types";

type SchemaObject = OpenAPIV3.SchemaObject;

let idCounter = 1;

function resetIdCounter(): void {
	idCounter = 1;
}

function generateString(schema: SchemaObject, propertyName?: string): string {
	if (schema.example !== undefined) return String(schema.example);
	if (schema.enum && schema.enum.length > 0) return String(schema.enum[0]);
	if (schema.default !== undefined) return String(schema.default);

	const name = propertyName?.toLowerCase() ?? "";
	if (name.includes("email")) return "user@example.com";
	if (name.includes("name")) return "John Doe";
	if (name.includes("url") || name.includes("link"))
		return "https://example.com";
	if (name.includes("phone")) return "+1-555-555-5555";
	if (name.includes("date")) return new Date().toISOString().split("T")[0];
	if (name.includes("time")) return new Date().toISOString();
	if (name.includes("id") || name.includes("uuid"))
		return "123e4567-e89b-12d3-a456-426614174000";
	if (name.includes("description")) return "A sample description";
	if (name.includes("title")) return "Sample Title";

	if (schema.format === "date") return new Date().toISOString().split("T")[0];
	if (schema.format === "date-time") return new Date().toISOString();
	if (schema.format === "email") return "user@example.com";
	if (schema.format === "uri" || schema.format === "url")
		return "https://example.com";
	if (schema.format === "uuid") return "123e4567-e89b-12d3-a456-426614174000";

	return "string";
}

function generateNumber(schema: SchemaObject, propertyName?: string): number {
	if (schema.example !== undefined) return Number(schema.example);
	if (schema.enum && schema.enum.length > 0) return Number(schema.enum[0]);
	if (schema.default !== undefined) return Number(schema.default);

	const name = propertyName?.toLowerCase() ?? "";
	if (name.includes("id")) return idCounter++;
	if (name.includes("count") || name.includes("total")) return 10;
	if (name.includes("price") || name.includes("amount")) return 99.99;
	if (name.includes("age")) return 25;
	if (name.includes("year")) return new Date().getFullYear();

	if (schema.minimum !== undefined) return schema.minimum;
	if (schema.maximum !== undefined) return schema.maximum;

	return schema.type === "integer" ? 1 : 1.0;
}

function generateBoolean(schema: SchemaObject): boolean {
	if (schema.example !== undefined) return Boolean(schema.example);
	if (schema.default !== undefined) return Boolean(schema.default);
	return true;
}

function generateArray(schema: SchemaObject, depth: number): unknown[] {
	if (schema.example !== undefined) return schema.example as unknown[];

	if (!schema.items) return [];

	const itemSchema = schema.items as SchemaObject;
	const count = schema.minItems ?? 1;
	const items: unknown[] = [];

	for (let i = 0; i < count; i++) {
		items.push(generateFromSchema(itemSchema, undefined, depth + 1));
	}

	return items;
}

function generateObject(
	schema: SchemaObject,
	depth: number,
): Record<string, unknown> {
	if (schema.example !== undefined)
		return schema.example as Record<string, unknown>;

	const result: Record<string, unknown> = {};

	if (schema.properties) {
		for (const [key, propSchema] of Object.entries(schema.properties)) {
			result[key] = generateFromSchema(
				propSchema as SchemaObject,
				key,
				depth + 1,
			);
		}
	}

	return result;
}

function generateFromSchema(
	schema: SchemaObject,
	propertyName?: string,
	depth = 0,
): unknown {
	if (depth > 10) return null;

	if (schema.example !== undefined) return schema.example;

	if (schema.allOf) {
		const merged: SchemaObject = { type: "object", properties: {} };
		for (const subSchema of schema.allOf) {
			const sub = subSchema as SchemaObject;
			if (sub.properties) {
				merged.properties = { ...merged.properties, ...sub.properties };
			}
		}
		return generateObject(merged, depth);
	}

	if (schema.oneOf && schema.oneOf.length > 0) {
		return generateFromSchema(
			schema.oneOf[0] as SchemaObject,
			propertyName,
			depth + 1,
		);
	}

	if (schema.anyOf && schema.anyOf.length > 0) {
		return generateFromSchema(
			schema.anyOf[0] as SchemaObject,
			propertyName,
			depth + 1,
		);
	}

	switch (schema.type) {
		case "string":
			return generateString(schema, propertyName);
		case "number":
		case "integer":
			return generateNumber(schema, propertyName);
		case "boolean":
			return generateBoolean(schema);
		case "array":
			return generateArray(schema, depth);
		case "object":
			return generateObject(schema, depth);
		case "null":
			return null;
		default:
			if (schema.properties) return generateObject(schema, depth);
			return null;
	}
}

export function generateExample(schema: SchemaObject): unknown {
	resetIdCounter();
	return generateFromSchema(schema);
}
