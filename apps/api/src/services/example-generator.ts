import type { OpenAPIV3 } from "openapi-types";

type SchemaObject = OpenAPIV3.SchemaObject;

const STRING_FORMAT_VALUES: Record<string, () => string> = {
	date: () => new Date().toISOString().split("T")[0],
	"date-time": () => new Date().toISOString(),
	email: () => "user@example.com",
	uri: () => "https://example.com",
	url: () => "https://example.com",
	uuid: () => "123e4567-e89b-12d3-a456-426614174000",
};

const STRING_NAME_PATTERNS: Array<{
	match: (name: string) => boolean;
	value: () => string;
}> = [
	{ match: (n) => n.includes("email"), value: () => "user@example.com" },
	{ match: (n) => n.includes("name"), value: () => "John Doe" },
	{
		match: (n) => n.includes("url") || n.includes("link"),
		value: () => "https://example.com",
	},
	{ match: (n) => n.includes("phone"), value: () => "+1-555-555-5555" },
	{
		match: (n) => n.includes("date"),
		value: () => new Date().toISOString().split("T")[0],
	},
	{ match: (n) => n.includes("time"), value: () => new Date().toISOString() },
	{
		match: (n) => n.includes("id") || n.includes("uuid"),
		value: () => "123e4567-e89b-12d3-a456-426614174000",
	},
	{
		match: (n) => n.includes("description"),
		value: () => "A sample description",
	},
	{ match: (n) => n.includes("title"), value: () => "Sample Title" },
];

const NUMBER_NAME_PATTERNS: Array<{
	match: (name: string) => boolean;
	value: (ctx: GeneratorContext) => number;
}> = [
	{ match: (n) => n.includes("id"), value: (ctx) => ctx.idCounter++ },
	{
		match: (n) => n.includes("count") || n.includes("total"),
		value: () => 10,
	},
	{
		match: (n) => n.includes("price") || n.includes("amount"),
		value: () => 99.99,
	},
	{ match: (n) => n.includes("age"), value: () => 25 },
	{ match: (n) => n.includes("year"), value: () => new Date().getFullYear() },
];

type GeneratorContext = { idCounter: number };

function createContext(): GeneratorContext {
	return { idCounter: 1 };
}

function generateString(schema: SchemaObject, propertyName?: string): string {
	if (schema.example !== undefined) {
		return String(schema.example);
	}
	if (schema.enum && schema.enum.length > 0) {
		return String(schema.enum[0]);
	}
	if (schema.default !== undefined) {
		return String(schema.default);
	}

	const name = propertyName?.toLowerCase() ?? "";
	for (const pattern of STRING_NAME_PATTERNS) {
		if (pattern.match(name)) {
			return pattern.value();
		}
	}

	if (schema.format) {
		const formatValue = STRING_FORMAT_VALUES[schema.format];
		if (formatValue) {
			return formatValue();
		}
	}

	return "string";
}

function generateNumber(
	schema: SchemaObject,
	propertyName: string | undefined,
	ctx: GeneratorContext,
): number {
	if (schema.example !== undefined) {
		return Number(schema.example);
	}
	if (schema.enum && schema.enum.length > 0) {
		return Number(schema.enum[0]);
	}
	if (schema.default !== undefined) {
		return Number(schema.default);
	}

	const name = propertyName?.toLowerCase() ?? "";
	for (const pattern of NUMBER_NAME_PATTERNS) {
		if (pattern.match(name)) {
			return pattern.value(ctx);
		}
	}

	if (schema.minimum !== undefined) {
		return schema.minimum;
	}
	if (schema.maximum !== undefined) {
		return schema.maximum;
	}

	return schema.type === "integer" ? 1 : 1.0;
}

function generateBoolean(schema: SchemaObject): boolean {
	if (schema.example !== undefined) {
		return Boolean(schema.example);
	}
	if (schema.default !== undefined) {
		return Boolean(schema.default);
	}
	return true;
}

function generateArray(
	schema: SchemaObject,
	depth: number,
	ctx: GeneratorContext,
): unknown[] {
	if (schema.example !== undefined) {
		return schema.example as unknown[];
	}
	if (schema.type !== "array" || !("items" in schema) || !schema.items) {
		return [];
	}

	const itemSchema = schema.items as SchemaObject;
	const count = schema.minItems ?? 1;

	return Array.from({ length: count }, () =>
		generateFromSchema(itemSchema, undefined, depth + 1, ctx),
	);
}

function generateObject(
	schema: SchemaObject,
	depth: number,
	ctx: GeneratorContext,
): Record<string, unknown> {
	if (schema.example !== undefined) {
		return schema.example as Record<string, unknown>;
	}

	if (!schema.properties) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(schema.properties).map(([key, propSchema]) => [
			key,
			generateFromSchema(propSchema as SchemaObject, key, depth + 1, ctx),
		]),
	);
}

function mergeAllOfSchemas(schemas: OpenAPIV3.SchemaObject[]): SchemaObject {
	return schemas.reduce<SchemaObject>(
		(merged, sub) => {
			if (sub.properties) {
				merged.properties = { ...merged.properties, ...sub.properties };
			}
			return merged;
		},
		{ type: "object", properties: {} },
	);
}

function generateFromSchema(
	schema: SchemaObject,
	propertyName: string | undefined,
	depth: number,
	ctx: GeneratorContext,
): unknown {
	if (depth > 10) {
		return null;
	}
	if (schema.example !== undefined) {
		return schema.example;
	}

	if (schema.allOf) {
		const merged = mergeAllOfSchemas(schema.allOf as SchemaObject[]);
		return generateObject(merged, depth, ctx);
	}

	if (schema.oneOf?.[0]) {
		return generateFromSchema(
			schema.oneOf[0] as SchemaObject,
			propertyName,
			depth + 1,
			ctx,
		);
	}

	if (schema.anyOf?.[0]) {
		return generateFromSchema(
			schema.anyOf[0] as SchemaObject,
			propertyName,
			depth + 1,
			ctx,
		);
	}

	const generators: Record<
		string,
		(s: SchemaObject, p: string | undefined, d: number) => unknown
	> = {
		string: (s, p) => generateString(s, p),
		number: (s, p) => generateNumber(s, p, ctx),
		integer: (s, p) => generateNumber(s, p, ctx),
		boolean: (s) => generateBoolean(s),
		array: (s, _, d) => generateArray(s, d, ctx),
		object: (s, _, d) => generateObject(s, d, ctx),
		null: () => null,
	};

	const generator = generators[schema.type as string];
	if (generator) {
		return generator(schema, propertyName, depth);
	}

	if (schema.properties) {
		return generateObject(schema, depth, ctx);
	}

	return null;
}

export function generateExample(schema: SchemaObject): unknown {
	return generateFromSchema(schema, undefined, 0, createContext());
}
