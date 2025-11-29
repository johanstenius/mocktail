import type { OpenAPIV3 } from "openapi-types";
import { generateExample } from "./example-generator.js";
import type { ParsedSpec } from "./openapi-parser.js";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ExtractedEndpoint = {
	method: HttpMethod;
	path: string;
	status: number;
	body: unknown;
};

const SUPPORTED_METHODS: HttpMethod[] = [
	"GET",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
];

function convertPath(openApiPath: string): string {
	return openApiPath.replace(/{([^}]+)}/g, ":$1");
}

function getSuccessStatus(responses: OpenAPIV3.ResponsesObject): number {
	const successCodes = ["200", "201", "202", "204"];
	for (const code of successCodes) {
		if (responses[code]) return Number.parseInt(code, 10);
	}
	const firstCode = Object.keys(responses).find(
		(code) => code.startsWith("2") && code !== "default",
	);
	return firstCode ? Number.parseInt(firstCode, 10) : 200;
}

function extractResponseBody(
	responses: OpenAPIV3.ResponsesObject,
	statusCode: number,
): unknown {
	const response = responses[statusCode.toString()] as
		| OpenAPIV3.ResponseObject
		| undefined;
	if (!response?.content) return {};

	const jsonContent =
		response.content["application/json"] ?? response.content["*/*"];
	if (!jsonContent?.schema) return {};

	const schema = jsonContent.schema as OpenAPIV3.SchemaObject;

	if (jsonContent.example !== undefined) return jsonContent.example;
	if (jsonContent.examples) {
		const firstExample = Object.values(jsonContent.examples)[0];
		if (firstExample && "value" in firstExample) return firstExample.value;
	}

	return generateExample(schema);
}

export function extractEndpoints(spec: ParsedSpec): ExtractedEndpoint[] {
	const endpoints: ExtractedEndpoint[] = [];

	if (!spec.paths) return endpoints;

	for (const [path, pathItem] of Object.entries(spec.paths)) {
		if (!pathItem) continue;

		for (const method of SUPPORTED_METHODS) {
			const operation = pathItem[
				method.toLowerCase() as keyof OpenAPIV3.PathItemObject
			] as OpenAPIV3.OperationObject | undefined;

			if (!operation?.responses) continue;

			const status = getSuccessStatus(operation.responses);
			const body = extractResponseBody(operation.responses, status);

			endpoints.push({
				method,
				path: convertPath(path),
				status,
				body,
			});
		}
	}

	return endpoints;
}
