import { prisma } from "./db/prisma";

export function findByToken(token: string) {
	return prisma.refreshToken.findUnique({
		where: { token },
	});
}

export function create(data: {
	userId: string;
	token: string;
	expiresAt: Date;
}) {
	return prisma.refreshToken.create({ data });
}

export function deleteByToken(token: string) {
	return prisma.refreshToken.delete({
		where: { token },
	});
}

export function deleteByUserId(userId: string) {
	return prisma.refreshToken.deleteMany({
		where: { userId },
	});
}

export function deleteExpired() {
	return prisma.refreshToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}
