import { prisma } from "./db/prisma";

export type CreatePasswordResetTokenInput = {
	userId: string;
	token: string;
	expiresAt: Date;
};

export function findByToken(token: string) {
	return prisma.passwordResetToken.findUnique({
		where: { token },
		include: { user: { select: { id: true, email: true } } },
	});
}

export function create(data: CreatePasswordResetTokenInput) {
	return prisma.passwordResetToken.create({ data });
}

export function deleteByToken(token: string) {
	return prisma.passwordResetToken.delete({ where: { token } });
}

export function deleteByUserId(userId: string) {
	return prisma.passwordResetToken.deleteMany({ where: { userId } });
}

export function deleteExpired() {
	return prisma.passwordResetToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}
