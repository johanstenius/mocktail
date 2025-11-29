import { prisma } from "./db/prisma";

export function findByOrgAndMonth(orgId: string, year: number, month: number) {
	return prisma.usageRecord.findUnique({
		where: { orgId_year_month: { orgId, year, month } },
	});
}

export async function getOrCreate(orgId: string, year: number, month: number) {
	return prisma.usageRecord.upsert({
		where: { orgId_year_month: { orgId, year, month } },
		update: {},
		create: { orgId, year, month, apiCalls: 0 },
	});
}

export function incrementApiCalls(orgId: string, year: number, month: number) {
	return prisma.usageRecord.upsert({
		where: { orgId_year_month: { orgId, year, month } },
		update: { apiCalls: { increment: 1 } },
		create: { orgId, year, month, apiCalls: 1 },
	});
}
