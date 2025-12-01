import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const MAX_SCHEMA_SIZE = 50 * 1024; // 50KB

export type ValidationResult =
	| { valid: true }
	| { valid: false; errors: string[] };

export type SchemaValidationResult =
	| { valid: true }
	| { valid: false; error: string };

export function isEmptySchema(schema: unknown): boolean {
	if (schema === null || schema === undefined) return true;
	if (typeof schema !== "object") return true;
	return Object.keys(schema as object).length === 0;
}

export function validateRequestBody(
	schema: unknown,
	body: unknown,
): ValidationResult {
	if (isEmptySchema(schema)) {
		return { valid: true };
	}

	try {
		const validate = ajv.compile(schema as object);
		const valid = validate(body);

		if (valid) {
			return { valid: true };
		}

		const errors = (validate.errors ?? []).map((err) => {
			const path = err.instancePath || "body";
			return `${path}: ${err.message}`;
		});

		return { valid: false, errors };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Validation error";
		return { valid: false, errors: [message] };
	}
}

export function validateJsonSchema(schema: unknown): SchemaValidationResult {
	if (isEmptySchema(schema)) {
		return { valid: true };
	}

	if (typeof schema !== "object" || schema === null) {
		return { valid: false, error: "Schema must be an object" };
	}

	const schemaStr = JSON.stringify(schema);
	if (schemaStr.length > MAX_SCHEMA_SIZE) {
		return {
			valid: false,
			error: `Schema exceeds maximum size of ${MAX_SCHEMA_SIZE / 1024}KB`,
		};
	}

	try {
		ajv.compile(schema as object);
		return { valid: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Invalid JSON Schema";
		return { valid: false, error: message };
	}
}
