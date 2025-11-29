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
