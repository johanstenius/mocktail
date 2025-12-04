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
