import { prisma } from "./db/prisma";

export type CreateEmailVerificationTokenInput = {
	userId: string;
	token: string;
	expiresAt: Date;
};

export function findByToken(token: string) {
	return prisma.emailVerificationToken.findUnique({
		where: { token },
		include: { user: { select: { id: true, email: true } } },
	});
}

export function create(data: CreateEmailVerificationTokenInput) {
	return prisma.emailVerificationToken.create({ data });
}

export function deleteByToken(token: string) {
	return prisma.emailVerificationToken.delete({ where: { token } });
}

export function deleteByUserId(userId: string) {
	return prisma.emailVerificationToken.deleteMany({ where: { userId } });
}

export function deleteExpired() {
	return prisma.emailVerificationToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}
