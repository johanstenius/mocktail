import * as logRepo from "../repositories/request-log.repository";

export type RequestLogModel = {
	id: string;
	projectId: string;
	endpointId: string | null;
	method: string;
	path: string;
	status: number;
	requestHeaders: string;
	requestBody: string | null;
	responseBody: string | null;
	duration: number;
	createdAt: Date;
};

export type FindLogsOptions = {
	projectId: string;
	limit?: number;
	offset?: number;
	method?: string;
	status?: number;
	endpointId?: string;
};

export type CreateLogInput = {
	projectId: string;
	endpointId: string | null;
	method: string;
	path: string;
	status: number;
	requestHeaders: Record<string, string>;
	requestBody: unknown;
	responseBody: unknown;
	duration: number;
};

export async function findByProjectId(
	options: FindLogsOptions,
): Promise<{ logs: RequestLogModel[]; total: number }> {
	const [logs, total] = await Promise.all([
		logRepo.findByProjectId(options),
		logRepo.countByProjectId(options),
	]);
	return { logs, total };
}

export function findById(
	id: string,
	projectId: string,
): Promise<RequestLogModel | null> {
	return logRepo.findByIdAndProject(id, projectId);
}

export function create(input: CreateLogInput): Promise<RequestLogModel> {
	return logRepo.create({
		projectId: input.projectId,
		endpointId: input.endpointId,
		method: input.method,
		path: input.path,
		status: input.status,
		requestHeaders: JSON.stringify(input.requestHeaders),
		requestBody:
			typeof input.requestBody === "string"
				? input.requestBody
				: JSON.stringify(input.requestBody),
		responseBody: JSON.stringify(input.responseBody),
		duration: input.duration,
	});
}

export async function clearByProjectId(projectId: string): Promise<number> {
	const result = await logRepo.removeByProjectId(projectId);
	return result.count;
}
