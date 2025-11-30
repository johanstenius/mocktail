import { prisma } from "./db/prisma";

export type CreateVariantData = {
	endpointId: string;
	name: string;
	priority: number;
	isDefault: boolean;
	status: number;
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
	rules: string;
	ruleLogic: string;
};

export type UpdateVariantData = Partial<Omit<CreateVariantData, "endpointId">>;

export function findByEndpointId(endpointId: string) {
	return prisma.responseVariant.findMany({
		where: { endpointId },
		orderBy: { priority: "asc" },
	});
}

export function findById(id: string) {
	return prisma.responseVariant.findUnique({
		where: { id },
	});
}

export function findByIdAndEndpoint(id: string, endpointId: string) {
	return prisma.responseVariant.findFirst({
		where: { id, endpointId },
	});
}

export function findDefaultByEndpoint(endpointId: string) {
	return prisma.responseVariant.findFirst({
		where: { endpointId, isDefault: true },
	});
}

export function create(data: CreateVariantData) {
	return prisma.responseVariant.create({ data });
}

export function update(id: string, data: UpdateVariantData) {
	return prisma.responseVariant.update({
		where: { id },
		data,
	});
}

export function remove(id: string) {
	return prisma.responseVariant.delete({
		where: { id },
	});
}

export function removeByEndpointId(endpointId: string) {
	return prisma.responseVariant.deleteMany({
		where: { endpointId },
	});
}

export function countByEndpointId(endpointId: string) {
	return prisma.responseVariant.count({
		where: { endpointId },
	});
}

export function updatePriorities(
	updates: Array<{ id: string; priority: number }>,
) {
	return prisma.$transaction(
		updates.map(({ id, priority }) =>
			prisma.responseVariant.update({
				where: { id },
				data: { priority },
			}),
		),
	);
}
