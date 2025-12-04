import { getLimits } from "../config/limits";
import * as auditRepo from "../repositories/audit.repository";
import * as batchJobRepo from "../repositories/batch-job.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as requestLogRepo from "../repositories/request-log.repository";
import { logger } from "../utils/logger";

export type OrgCleanupResult = {
	orgId: string;
	orgName: string;
	projectsProcessed: number;
	logsDeleted: number;
	auditLogsDeleted: number;
};

export type CleanupResult = {
	jobId: string;
	results: OrgCleanupResult[];
	totalDeleted: number;
};

export async function cleanupExpiredLogs(): Promise<CleanupResult> {
	const job = await batchJobRepo.create({
		type: "request_log_cleanup",
		status: "running",
	});

	try {
		const orgs = await orgRepo.findAllWithProjectsForCleanup();

		const results: OrgCleanupResult[] = [];
		let totalDeleted = 0;

		for (const org of orgs) {
			const tier = org.subscription?.tier ?? "free";
			const limits = getLimits(tier);

			const requestLogCutoff = new Date();
			requestLogCutoff.setDate(
				requestLogCutoff.getDate() - limits.requestLogRetentionDays,
			);

			const auditLogCutoff = new Date();
			auditLogCutoff.setDate(
				auditLogCutoff.getDate() - limits.auditLogRetentionDays,
			);

			let orgLogsDeleted = 0;
			for (const project of org.projects) {
				const deleted = await requestLogRepo.removeOlderThan(
					project.id,
					requestLogCutoff,
				);
				orgLogsDeleted += deleted;
			}

			const auditLogsDeleted = await auditRepo.removeOlderThan(
				org.id,
				auditLogCutoff,
			);

			if (orgLogsDeleted > 0 || auditLogsDeleted > 0) {
				results.push({
					orgId: org.id,
					orgName: org.name,
					projectsProcessed: org.projects.length,
					logsDeleted: orgLogsDeleted,
					auditLogsDeleted,
				});
				totalDeleted += orgLogsDeleted + auditLogsDeleted;
			}
		}

		logger.info(
			{
				jobId: job.id,
				totalDeleted,
				orgsAffected: results.length,
			},
			"log cleanup completed",
		);

		await batchJobRepo.markCompleted(job.id, {
			results,
			totalDeleted,
		});

		return { jobId: job.id, results, totalDeleted };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error({ jobId: job.id, error: errorMessage }, "log cleanup failed");
		await batchJobRepo.markFailed(job.id, errorMessage);
		throw error;
	}
}
