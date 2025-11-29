import { prisma } from "./db/prisma";

export type CreateApiKeyInput = {
	key: string;
	name: string;
	orgId: string;
};

export function findByOrgId(orgId: string) {
	return prisma.apiKey.findMany({
		where: { orgId },
		orderBy: { createdAt: "desc" },
	});
}

export function findByKey(key: string) {
	return prisma.apiKey.findUnique({
		where: { key },
		include: { org: true },
	});
}

export function create(data: CreateApiKeyInput) {
	return prisma.apiKey.create({ data });
}

export function remove(id: string) {
	return prisma.apiKey.delete({ where: { id } });
}
