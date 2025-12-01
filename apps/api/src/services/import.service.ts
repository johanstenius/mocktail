import * as endpointRepo from "../repositories/endpoint.repository";
import * as projectRepo from "../repositories/project.repository";
import * as variantRepo from "../repositories/variant.repository";
import { parseSpec } from "./openapi-parser";
import { extractEndpoints } from "./spec-extractor";

export type ImportedEndpoint = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	status: number;
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
	requestBodySchema: string;
	validationMode: string;
	createdAt: Date;
	updatedAt: Date;
};

type PrismaEndpoint = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	status: number | null;
	headers: string | null;
	body: string | null;
	bodyType: string | null;
	delay: number | null;
	failRate: number | null;
	requestBodySchema: string;
	validationMode: string;
	createdAt: Date;
	updatedAt: Date;
};

function toImportedEndpoint(e: PrismaEndpoint): ImportedEndpoint {
	return {
		id: e.id,
		projectId: e.projectId,
		method: e.method,
		path: e.path,
		status: e.status ?? 200,
		headers: e.headers ?? "{}",
		body: e.body ?? "",
		bodyType: e.bodyType ?? "static",
		delay: e.delay ?? 0,
		failRate: e.failRate ?? 0,
		requestBodySchema: e.requestBodySchema,
		validationMode: e.validationMode,
		createdAt: e.createdAt,
		updatedAt: e.updatedAt,
	};
}

export type ImportResult =
	| {
			success: true;
			created: number;
			skipped: number;
			endpoints: ImportedEndpoint[];
	  }
	| {
			success: false;
			error: "project_not_found" | "invalid_spec";
			message?: string;
	  };

export async function importSpec(
	projectId: string,
	spec: string | Record<string, unknown>,
	options?: { overwrite?: boolean },
): Promise<ImportResult> {
	const project = await projectRepo.findById(projectId);
	if (!project) {
		return { success: false, error: "project_not_found" };
	}

	const parseResult = await parseSpec(spec);
	if (!parseResult.success) {
		return {
			success: false,
			error: "invalid_spec",
			message: parseResult.error,
		};
	}

	const extracted = extractEndpoints(parseResult.spec);

	if (extracted.length === 0) {
		return { success: true, created: 0, skipped: 0, endpoints: [] };
	}

	const overwrite = options?.overwrite ?? false;
	const createdEndpoints: ImportedEndpoint[] = [];
	let skipped = 0;

	for (const ep of extracted) {
		const existing = await endpointRepo.findByMethodAndPath(
			projectId,
			ep.method,
			ep.path,
		);

		if (existing) {
			if (overwrite) {
				const updated = await endpointRepo.update(existing.id, {
					status: ep.status,
					body: JSON.stringify(ep.body),
				});
				createdEndpoints.push(toImportedEndpoint(updated));
			} else {
				skipped++;
			}
			continue;
		}

		const created = await endpointRepo.create({
			projectId,
			method: ep.method,
			path: ep.path,
			status: ep.status,
			headers: JSON.stringify({ "Content-Type": "application/json" }),
			body: JSON.stringify(ep.body),
			bodyType: "static",
			delay: 0,
			failRate: 0,
			requestBodySchema: ep.requestBodySchema
				? JSON.stringify(ep.requestBodySchema)
				: "{}",
			validationMode: "none",
		});

		await variantRepo.create({
			endpointId: created.id,
			name: "Default",
			priority: 0,
			isDefault: true,
			status: ep.status,
			headers: JSON.stringify({ "Content-Type": "application/json" }),
			body: JSON.stringify(ep.body),
			bodyType: "static",
			delay: 0,
			failRate: 0,
			rules: "[]",
			ruleLogic: "and",
		});

		createdEndpoints.push(toImportedEndpoint(created));
	}

	return {
		success: true,
		created: createdEndpoints.length,
		skipped,
		endpoints: createdEndpoints,
	};
}
