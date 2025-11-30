import type { OAuthProvider } from "@prisma/client";
import { prisma } from "./db/prisma";

export function findById(id: string) {
	return prisma.user.findUnique({
		where: { id },
	});
}

export function findEmailById(id: string) {
	return prisma.user.findUnique({
		where: { id },
		select: { email: true },
	});
}

export function findByEmail(email: string) {
	return prisma.user.findUnique({
		where: { email },
	});
}

export function findByOAuthProvider(provider: OAuthProvider, oauthId: string) {
	return prisma.user.findUnique({
		where: {
			oauthProvider_oauthId: {
				oauthProvider: provider,
				oauthId,
			},
		},
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

export type CreateOAuthUserWithOrgInput = {
	email: string;
	name: string;
	oauthProvider: OAuthProvider;
	oauthId: string;
	orgName: string;
	orgSlug: string;
};

export async function createOAuthUserWithOrg(
	input: CreateOAuthUserWithOrgInput,
) {
	return prisma.$transaction(async (tx) => {
		const existingUser = await tx.user.findUnique({
			where: { email: input.email },
		});
		if (existingUser) {
			return { error: "email_exists" as const };
		}

		const user = await tx.user.create({
			data: {
				email: input.email,
				name: input.name,
				oauthProvider: input.oauthProvider,
				oauthId: input.oauthId,
				emailVerifiedAt: new Date(),
				hasCompletedOnboarding: true,
				onboardingCompletedAt: new Date(),
			},
		});

		const org = await tx.organization.create({
			data: {
				name: input.orgName,
				slug: input.orgSlug,
				ownerId: user.id,
			},
		});

		await tx.orgMembership.create({
			data: {
				userId: user.id,
				orgId: org.id,
				role: "owner",
			},
		});

		return { user, org };
	});
}
