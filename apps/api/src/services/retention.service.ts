import { getLimits } from "../config/limits";
import * as batchJobRepo from "../repositories/batch-job.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as requestLogRepo from "../repositories/request-log.repository";
import * as tokenRepo from "../repositories/token.repository";
import { logger } from "../utils/logger";

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
		const orgs = await orgRepo.findAllWithProjectsForCleanup();

		const results: OrgCleanupResult[] = [];
		let totalDeleted = 0;

		for (const org of orgs) {
			const limits = getLimits(org.tier);
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - limits.requestLogRetentionDays);

			let orgLogsDeleted = 0;
			for (const project of org.projects) {
				const deleted = await requestLogRepo.removeOlderThan(
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

		const [expiredVerificationTokens, expiredPasswordResets] =
			await Promise.all([
				tokenRepo.removeExpiredEmailVerifications(),
				tokenRepo.removeExpiredPasswordResets(),
			]);

		logger.info(
			{
				jobId: job.id,
				totalDeleted,
				orgsAffected: results.length,
				expiredTokens: {
					emailVerification: expiredVerificationTokens.count,
					passwordReset: expiredPasswordResets.count,
				},
			},
			"log cleanup completed",
		);

		await batchJobRepo.markCompleted(
			job.id,
			JSON.stringify({
				results,
				totalDeleted,
				expiredTokens: {
					emailVerification: expiredVerificationTokens.count,
					passwordReset: expiredPasswordResets.count,
				},
			}),
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
