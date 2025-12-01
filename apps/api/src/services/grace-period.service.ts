import * as batchJobRepo from "../repositories/batch-job.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as userRepo from "../repositories/user.repository";
import { logger } from "../utils/logger";
import { sendDowngradedEmail, sendPaymentReminderEmail } from "./email.service";

const GRACE_DAYS = 7;
const REMINDER_DAY = 5;

export type GraceExpiryResult = {
	jobId: string;
	downgraded: { orgId: string; orgName: string }[];
	reminders: { orgId: string; orgName: string }[];
};

export async function processGracePeriods(): Promise<GraceExpiryResult> {
	const job = await batchJobRepo.create({
		type: "usage_reset",
		status: "running",
	});

	try {
		const downgraded = await downgradeExpiredOrgs();
		const reminders = await sendReminders();

		logger.info(
			{
				jobId: job.id,
				downgradedCount: downgraded.length,
				reminderCount: reminders.length,
			},
			"grace period job completed",
		);

		await batchJobRepo.markCompleted(job.id, { downgraded, reminders });

		return { jobId: job.id, downgraded, reminders };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(
			{ jobId: job.id, error: errorMessage },
			"grace period job failed",
		);
		await batchJobRepo.markFailed(job.id, errorMessage);
		throw error;
	}
}

async function downgradeExpiredOrgs(): Promise<
	{ orgId: string; orgName: string }[]
> {
	const expired = await orgRepo.findOrgsWithExpiredGrace(GRACE_DAYS);
	const results: { orgId: string; orgName: string }[] = [];

	for (const org of expired) {
		await orgRepo.updateSubscription(org.id, {
			tier: "free",
			stripeSubscriptionId: null,
			stripeCancelAtPeriodEnd: false,
			stripeCurrentPeriodEnd: null,
			paymentFailedAt: null,
			lastFailedInvoiceId: null,
		});

		const owner = await getOrgOwnerEmail(org.ownerId);
		if (owner) {
			await sendDowngradedEmail({
				to: owner.email,
				orgName: org.name,
			});
		}

		logger.info({ orgId: org.id }, "org downgraded after grace expiry");
		results.push({ orgId: org.id, orgName: org.name });
	}

	return results;
}

async function sendReminders(): Promise<{ orgId: string; orgName: string }[]> {
	const orgs = await orgRepo.findOrgsNeedingReminder(REMINDER_DAY);
	const results: { orgId: string; orgName: string }[] = [];
	const daysRemaining = GRACE_DAYS - REMINDER_DAY;

	for (const org of orgs) {
		await sendPaymentReminderEmail({
			to: org.owner.email,
			orgName: org.name,
			daysRemaining,
		});

		logger.info({ orgId: org.id, daysRemaining }, "sent payment reminder");
		results.push({ orgId: org.id, orgName: org.name });
	}

	return results;
}

async function getOrgOwnerEmail(
	ownerId: string,
): Promise<{ email: string } | null> {
	return userRepo.findEmailById(ownerId);
}
