import { prisma } from "./db/prisma";

export function findById(id: string) {
	return prisma.user.findUnique({
		where: { id },
	});
}

export function findByEmail(email: string) {
	return prisma.user.findUnique({
		where: { email },
	});
}

export function create(data: { email: string; passwordHash: string }) {
	return prisma.user.create({ data });
}

export function findByIdWithMemberships(id: string) {
	return prisma.user.findUnique({
		where: { id },
		include: {
			memberships: {
				include: { org: true },
			},
		},
	});
}

export function updatePassword(userId: string, passwordHash: string) {
	return prisma.user.update({
		where: { id: userId },
		data: { passwordHash },
	});
}

export function updateEmailVerifiedAt(userId: string, date: Date) {
	return prisma.user.update({
		where: { id: userId },
		data: { emailVerifiedAt: date },
	});
}

export async function resetPasswordWithToken(
	userId: string,
	passwordHash: string,
	token: string,
) {
	return prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: { id: userId },
			data: { passwordHash },
		});
		await tx.passwordResetToken.delete({ where: { token } });
	});
}

export async function verifyEmailWithToken(userId: string, token: string) {
	return prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: { id: userId },
			data: { emailVerifiedAt: new Date() },
		});
		await tx.emailVerificationToken.delete({ where: { token } });
	});
}

export function markOnboardingComplete(userId: string) {
	return prisma.user.update({
		where: { id: userId },
		data: {
			hasCompletedOnboarding: true,
			onboardingCompletedAt: new Date(),
		},
	});
}
