import { getLimits } from "../config/limits";
import { logger } from "../lib/logger";
import * as batchJobRepo from "../repositories/batch-job.repository";
import { prisma } from "../repositories/db/prisma";
import * as requestLogRepo from "../repositories/request-log.repository";

export type OrgCleanupResult = {
	orgId: string;
	orgName: string;
	projectsProcessed: number;
	logsDeleted: number;
};

export type CleanupResult = {
	jobId: string;
	results: OrgCleanupResult[];
	totalDeleted: number;
};

export async function cleanupExpiredLogs(): Promise<CleanupResult> {
	const job = await batchJobRepo.create({
		type: "log_cleanup",
		status: "running",
	});

	try {
		const orgs = await prisma.organization.findMany({
			select: {
				id: true,
				name: true,
				tier: true,
				projects: { select: { id: true } },
			},
		});

		const results: OrgCleanupResult[] = [];
		let totalDeleted = 0;

		for (const org of orgs) {
			const limits = getLimits(org.tier);
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - limits.requestLogRetentionDays);

			let orgLogsDeleted = 0;
			for (const project of org.projects) {
				const deleted = await requestLogRepo.deleteOlderThan(
					project.id,
					cutoffDate,
				);
				orgLogsDeleted += deleted;
			}

			if (orgLogsDeleted > 0) {
				results.push({
					orgId: org.id,
					orgName: org.name,
					projectsProcessed: org.projects.length,
					logsDeleted: orgLogsDeleted,
				});
				totalDeleted += orgLogsDeleted;
			}
		}

		logger.info(
			{ jobId: job.id, totalDeleted, orgsAffected: results.length },
			"log cleanup completed",
		);

		await batchJobRepo.markCompleted(
			job.id,
			JSON.stringify({ results, totalDeleted }),
		);

		return { jobId: job.id, results, totalDeleted };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error({ jobId: job.id, error: errorMessage }, "log cleanup failed");
		await batchJobRepo.markFailed(job.id, errorMessage);
		throw error;
	}
}
