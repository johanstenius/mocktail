import { randomUUID } from "node:crypto";
import * as bucketRepo from "../repositories/bucket.repository";
import {
	deleteBucketData,
	getBucketData,
	setBucketData,
} from "./state.service";

type BucketItem = Record<string, unknown>;

type CrudConfig = {
	projectId: string;
	bucketName: string;
	idField: string;
};

type CrudResult =
	| { success: true; status: number; body: unknown }
	| {
			success: false;
			status: number;
			body: { error: string; message: string };
	  };

async function loadBucketData(
	projectId: string,
	bucketName: string,
): Promise<BucketItem[]> {
	const cached = getBucketData(projectId, bucketName);
	if (cached) return cached;

	const bucket = await bucketRepo.findByName(projectId, bucketName);
	if (!bucket) return [];

	try {
		const data = JSON.parse(bucket.data);
		const items = Array.isArray(data) ? data : [];
		setBucketData(projectId, bucketName, items);
		return items;
	} catch {
		return [];
	}
}

async function saveBucketData(
	projectId: string,
	bucketName: string,
	data: BucketItem[],
): Promise<void> {
	setBucketData(projectId, bucketName, data);
	await bucketRepo.update(projectId, bucketName, {
		data: JSON.stringify(data),
	});
}

export async function handleGetAll(config: CrudConfig): Promise<CrudResult> {
	const data = await loadBucketData(config.projectId, config.bucketName);
	return { success: true, status: 200, body: data };
}

export async function handleGetOne(
	config: CrudConfig,
	id: string,
): Promise<CrudResult> {
	const data = await loadBucketData(config.projectId, config.bucketName);
	const item = data.find((d) => String(d[config.idField]) === id);

	if (!item) {
		return {
			success: false,
			status: 404,
			body: {
				error: "not_found",
				message: `Item with ${config.idField}=${id} not found`,
			},
		};
	}

	return { success: true, status: 200, body: item };
}

export async function handleCreate(
	config: CrudConfig,
	body: unknown,
): Promise<CrudResult> {
	if (!body || typeof body !== "object") {
		return {
			success: false,
			status: 400,
			body: {
				error: "invalid_body",
				message: "Request body must be an object",
			},
		};
	}

	const data = await loadBucketData(config.projectId, config.bucketName);
	const item = body as BucketItem;

	if (!item[config.idField]) {
		item[config.idField] = randomUUID();
	}

	const existingIndex = data.findIndex(
		(d) => String(d[config.idField]) === String(item[config.idField]),
	);
	if (existingIndex !== -1) {
		return {
			success: false,
			status: 409,
			body: {
				error: "conflict",
				message: `Item with ${config.idField}=${item[config.idField]} already exists`,
			},
		};
	}

	data.push(item);
	await saveBucketData(config.projectId, config.bucketName, data);

	return { success: true, status: 201, body: item };
}

export async function handleUpdate(
	config: CrudConfig,
	id: string,
	body: unknown,
): Promise<CrudResult> {
	if (!body || typeof body !== "object") {
		return {
			success: false,
			status: 400,
			body: {
				error: "invalid_body",
				message: "Request body must be an object",
			},
		};
	}

	const data = await loadBucketData(config.projectId, config.bucketName);
	const index = data.findIndex((d) => String(d[config.idField]) === id);

	if (index === -1) {
		return {
			success: false,
			status: 404,
			body: {
				error: "not_found",
				message: `Item with ${config.idField}=${id} not found`,
			},
		};
	}

	const updated = { ...data[index], ...(body as BucketItem) };
	updated[config.idField] = id;
	data[index] = updated;

	await saveBucketData(config.projectId, config.bucketName, data);

	return { success: true, status: 200, body: updated };
}

export async function handleDelete(
	config: CrudConfig,
	id: string,
): Promise<CrudResult> {
	const data = await loadBucketData(config.projectId, config.bucketName);
	const index = data.findIndex((d) => String(d[config.idField]) === id);

	if (index === -1) {
		return {
			success: false,
			status: 404,
			body: {
				error: "not_found",
				message: `Item with ${config.idField}=${id} not found`,
			},
		};
	}

	data.splice(index, 1);
	await saveBucketData(config.projectId, config.bucketName, data);

	return { success: true, status: 204, body: null };
}

export function clearBucketCache(projectId: string, bucketName: string): void {
	deleteBucketData(projectId, bucketName);
}
