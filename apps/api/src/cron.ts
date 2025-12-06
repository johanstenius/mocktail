import cron from "node-cron";
import { processGracePeriods } from "./services/grace-period.service";
import { cleanupExpiredLogs } from "./services/retention.service";
import { logger } from "./utils/logger";

export function initCronJobs(): void {
	// Run cleanup daily at 3am
	cron.schedule("0 3 * * *", async () => {
		logger.info("starting scheduled cleanup jobs");
		try {
			const logResult = await cleanupExpiredLogs();
			logger.info(
				{ totalDeleted: logResult.totalDeleted },
				"log cleanup completed",
			);

			const graceResult = await processGracePeriods();
			logger.info(
				{
					downgraded: graceResult.downgraded.length,
					reminders: graceResult.reminders.length,
				},
				"grace period processing completed",
			);
		} catch (error) {
			logger.error({ error }, "scheduled cleanup failed");
		}
	});

	logger.info("cron jobs initialized - cleanup scheduled for 3am daily");
}
