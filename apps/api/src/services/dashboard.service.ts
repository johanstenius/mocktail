import * as orgRepo from "../repositories/organization.repository";
import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";
import type { ActivityItem, DashboardStats } from "../schemas/dashboard";

export async function getStats(orgId: string): Promise<DashboardStats> {
	const now = new Date();
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

	const [projects, teamMembers] = await Promise.all([
		projectRepo.findByOrgIdWithStats(orgId, startOfWeek),
		orgRepo.countMembersByOrgId(orgId),
	]);

	let endpoints = 0;
	let requestsToday = 0;
	let requestsThisWeek = 0;

	for (const project of projects) {
		endpoints += project._count.endpoints;
		for (const log of project.requestLogs) {
			requestsThisWeek++;
			if (log.createdAt >= startOfToday) {
				requestsToday++;
			}
		}
	}

	return {
		projects: projects.length,
		endpoints,
		requestsToday,
		requestsThisWeek,
		teamMembers,
	};
}

export async function getActivity(
	orgId: string,
	limit: number,
): Promise<ActivityItem[]> {
	const projects = await projectRepo.findByOrgId(orgId);
	const projectIds = projects.map((p) => p.id);

	if (projectIds.length === 0) {
		return [];
	}

	const logs = await logRepo.findRecentByProjectIds(projectIds, limit);

	return logs.map((log) => ({
		id: log.id,
		type: "request" as const,
		projectId: log.project.id,
		projectName: log.project.name,
		endpointId: log.endpoint?.id,
		endpointPath: log.endpoint?.path,
		method: log.method,
		status: log.status,
		createdAt: log.createdAt.toISOString(),
	}));
}
