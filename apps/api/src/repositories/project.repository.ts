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

export function findBySlug(slug: string) {
	return prisma.project.findUnique({
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
	apiKey?: string;
	orgId: string;
}) {
	return prisma.project.create({ data });
}

export function update(id: string, data: { name?: string; slug?: string }) {
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
