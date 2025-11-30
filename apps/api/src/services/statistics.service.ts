import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";

export type EndpointStat = {
	endpointId: string;
	requestCount: number;
	lastRequestAt: Date | null;
};

export type UnmatchedRequest = {
	method: string;
	path: string;
	count: number;
	lastRequestAt: Date | null;
};

export type ProjectStatistics = {
	endpoints: EndpointStat[];
	unmatched: UnmatchedRequest[];
	avgLatency: number | null;
};

export async function getProjectStatistics(
	projectId: string,
): Promise<ProjectStatistics | null> {
	const project = await projectRepo.findById(projectId);
	if (!project) return null;

	const [endpointStats, unmatchedStats, latencyStats] = await Promise.all([
		logRepo.getEndpointStats(projectId),
		logRepo.getUnmatchedRequests(projectId),
		logRepo.getAvgLatency(projectId),
	]);

	const endpoints: EndpointStat[] = endpointStats.map((stat) => ({
		endpointId: stat.endpointId as string,
		requestCount: stat._count.id,
		lastRequestAt: stat._max.createdAt,
	}));

	const unmatched: UnmatchedRequest[] = unmatchedStats.map((stat) => ({
		method: stat.method,
		path: stat.path,
		count: stat._count.id,
		lastRequestAt: stat._max.createdAt,
	}));

	const avgLatency = latencyStats._avg.duration
		? Math.round(latencyStats._avg.duration)
		: null;

	return { endpoints, unmatched, avgLatency };
}
