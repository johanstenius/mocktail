import { prisma } from "./db/prisma";

export type ProjectWithEndpoints = Awaited<
	ReturnType<typeof findBySlugWithEndpoints>
>;

export function findAll() {
	return prisma.project.findMany({
		orderBy: { createdAt: "desc" },
	});
}

export function findByOrgId(orgId: string) {
	return prisma.project.findMany({
		where: { orgId },
		orderBy: { createdAt: "desc" },
	});
}

export function findById(id: string) {
	return prisma.project.findUnique({
		where: { id },
	});
}

export function findByIdWithEndpoints(id: string, method?: string) {
	return prisma.project.findUnique({
		where: { id },
		include: {
			endpoints: {
				where: method ? { method } : undefined,
				include: {
					variants: { orderBy: { priority: "asc" } },
				},
			},
		},
	});
}

export function findBySlug(slug: string) {
	return prisma.project.findFirst({
		where: { slug },
	});
}

export function findBySlugAndOrgId(slug: string, orgId: string) {
	return prisma.project.findFirst({
		where: { slug, orgId },
	});
}

export function findBySlugWithEndpoints(slug: string, method?: string) {
	return prisma.project.findFirst({
		where: { slug },
		include: {
			endpoints: method ? { where: { method } } : true,
		},
	});
}

export function findByOrgSlugAndProjectSlug(
	orgSlug: string,
	projectSlug: string,
	method?: string,
) {
	return prisma.project.findFirst({
		where: {
			slug: projectSlug,
			org: { slug: orgSlug },
		},
		include: {
			endpoints: method ? { where: { method } } : true,
		},
	});
}

export function create(data: {
	name: string;
	slug: string;
	apiKey: string;
	orgId: string;
}) {
	return prisma.project.create({ data });
}

export function update(
	id: string,
	data: {
		name?: string;
		slug?: string;
		proxyBaseUrl?: string | null;
		proxyTimeout?: number;
		proxyAuthHeader?: string | null;
		proxyPassThroughAuth?: boolean;
	},
) {
	return prisma.project.update({
		where: { id },
		data,
	});
}

export function remove(id: string) {
	return prisma.project.delete({
		where: { id },
	});
}

export function findByApiKey(apiKey: string) {
	return prisma.project.findUnique({
		where: { apiKey },
		include: { org: { select: { id: true, tier: true } } },
	});
}

export function findByIdWithOrg(id: string) {
	return prisma.project.findUnique({
		where: { id },
		include: { org: { select: { id: true, tier: true } } },
	});
}

export async function sumMonthlyRequestsByOrgId(
	orgId: string,
): Promise<number> {
	const result = await prisma.project.aggregate({
		where: { orgId },
		_sum: { monthlyRequests: true },
	});
	return result._sum.monthlyRequests ?? 0;
}

export function updateApiKey(id: string, apiKey: string) {
	return prisma.project.update({
		where: { id },
		data: { apiKey },
	});
}

export function incrementMonthlyRequests(id: string) {
	return prisma.project.update({
		where: { id },
		data: { monthlyRequests: { increment: 1 } },
	});
}

export function resetMonthlyRequests(id: string) {
	return prisma.project.update({
		where: { id },
		data: { monthlyRequests: 1, requestResetAt: new Date() },
	});
}

export function findByOrgIdWithStats(orgId: string, weekStart: Date) {
	return prisma.project.findMany({
		where: { orgId },
		include: {
			_count: { select: { endpoints: true } },
			requestLogs: {
				where: { createdAt: { gte: weekStart } },
				select: { createdAt: true },
			},
		},
	});
}
