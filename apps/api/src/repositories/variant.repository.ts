import type { Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";

export type CreateVariantData = {
	endpointId: string;
	name: string;
	priority: number;
	isDefault: boolean;
	status: number;
	headers: unknown;
	body: unknown;
	bodyType: string;
	delay: number;
	failRate: number;
	rules: unknown;
	ruleLogic: string;
	sequenceIndex: number | null;
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
	return prisma.responseVariant.create({
		data: {
			endpointId: data.endpointId,
			name: data.name,
			priority: data.priority,
			isDefault: data.isDefault,
			status: data.status,
			headers: data.headers as Prisma.InputJsonValue,
			body: data.body as Prisma.InputJsonValue,
			bodyType: data.bodyType,
			delay: data.delay,
			failRate: data.failRate,
			rules: data.rules as Prisma.InputJsonValue,
			ruleLogic: data.ruleLogic,
			sequenceIndex: data.sequenceIndex,
		},
	});
}

export function update(id: string, data: UpdateVariantData) {
	return prisma.responseVariant.update({
		where: { id },
		data: {
			...(data.name && { name: data.name }),
			...(data.priority !== undefined && { priority: data.priority }),
			...(data.isDefault !== undefined && { isDefault: data.isDefault }),
			...(data.status !== undefined && { status: data.status }),
			...(data.headers !== undefined && {
				headers: data.headers as Prisma.InputJsonValue,
			}),
			...(data.body !== undefined && {
				body: data.body as Prisma.InputJsonValue,
			}),
			...(data.bodyType && { bodyType: data.bodyType }),
			...(data.delay !== undefined && { delay: data.delay }),
			...(data.failRate !== undefined && { failRate: data.failRate }),
			...(data.rules !== undefined && {
				rules: data.rules as Prisma.InputJsonValue,
			}),
			...(data.ruleLogic && { ruleLogic: data.ruleLogic }),
			...(data.sequenceIndex !== undefined && {
				sequenceIndex: data.sequenceIndex,
			}),
		},
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
