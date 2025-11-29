import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import YAML from "yaml";

export type ParsedSpec = OpenAPIV3.Document | OpenAPIV3_1.Document;

export type ParseResult =
	| { success: true; spec: ParsedSpec }
	| { success: false; error: string };

function isOpenAPI3(spec: OpenAPI.Document): spec is ParsedSpec {
	return "openapi" in spec && spec.openapi.startsWith("3.");
}

export async function parseSpec(input: string | object): Promise<ParseResult> {
	try {
		let spec: unknown;

		if (typeof input === "string") {
			const trimmed = input.trim();
			if (trimmed.startsWith("{")) {
				spec = JSON.parse(trimmed);
			} else {
				spec = YAML.parse(trimmed);
			}
		} else {
			spec = input;
		}

		const validated = await SwaggerParser.validate(spec as OpenAPI.Document);
		const dereferenced = await SwaggerParser.dereference(
			validated as OpenAPI.Document,
		);

		if (!isOpenAPI3(dereferenced)) {
			return {
				success: false,
				error: "Only OpenAPI 3.x specs are supported",
			};
		}

		return { success: true, spec: dereferenced };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown parse error";
		return { success: false, error: message };
	}
}
