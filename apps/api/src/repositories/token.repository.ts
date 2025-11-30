import { prisma } from "./db/prisma";

type CreateTokenInput = {
	userId: string;
	token: string;
	expiresAt: Date;
};

// Email Verification Tokens

export function findEmailVerificationByToken(token: string) {
	return prisma.emailVerificationToken.findUnique({
		where: { token },
		include: { user: { select: { id: true, email: true } } },
	});
}

export function createEmailVerification(data: CreateTokenInput) {
	return prisma.emailVerificationToken.create({ data });
}

export function removeEmailVerificationByToken(token: string) {
	return prisma.emailVerificationToken.delete({ where: { token } });
}

export function removeEmailVerificationByUserId(userId: string) {
	return prisma.emailVerificationToken.deleteMany({ where: { userId } });
}

export function removeExpiredEmailVerifications() {
	return prisma.emailVerificationToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}

// Password Reset Tokens

export function findPasswordResetByToken(token: string) {
	return prisma.passwordResetToken.findUnique({
		where: { token },
		include: { user: { select: { id: true, email: true } } },
	});
}

export function createPasswordReset(data: CreateTokenInput) {
	return prisma.passwordResetToken.create({ data });
}

export function removePasswordResetByToken(token: string) {
	return prisma.passwordResetToken.delete({ where: { token } });
}

export function removePasswordResetByUserId(userId: string) {
	return prisma.passwordResetToken.deleteMany({ where: { userId } });
}

export function removeExpiredPasswordResets() {
	return prisma.passwordResetToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}

// Refresh Tokens

export function findRefreshByToken(token: string) {
	return prisma.refreshToken.findUnique({
		where: { token },
	});
}

export function createRefresh(data: CreateTokenInput) {
	return prisma.refreshToken.create({ data });
}

export function removeRefreshByToken(token: string) {
	return prisma.refreshToken.delete({
		where: { token },
	});
}

export function removeRefreshByUserId(userId: string) {
	return prisma.refreshToken.deleteMany({
		where: { userId },
	});
}

export function removeExpiredRefreshTokens() {
	return prisma.refreshToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}
