import * as bucketRepo from "../repositories/bucket.repository";
import * as projectRepo from "../repositories/project.repository";

export type BucketModel = {
	id: string;
	projectId: string;
	name: string;
	data: unknown[];
	createdAt: Date;
	updatedAt: Date;
};

export type CreateBucketInput = {
	name: string;
	data?: unknown[];
};

export type UpdateBucketInput = {
	data: unknown[];
};

function parseData(dataStr: string): unknown[] {
	try {
		const parsed = JSON.parse(dataStr);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function dbToModel(
	db: Awaited<ReturnType<typeof bucketRepo.findByName>>,
): BucketModel | null {
	if (!db) return null;
	return {
		id: db.id,
		projectId: db.projectId,
		name: db.name,
		data: parseData(db.data),
		createdAt: db.createdAt,
		updatedAt: db.updatedAt,
	};
}

export async function findByProjectId(
	projectId: string,
): Promise<BucketModel[]> {
	const buckets = await bucketRepo.findByProjectId(projectId);
	return buckets.map((b) => ({
		id: b.id,
		projectId: b.projectId,
		name: b.name,
		data: parseData(b.data),
		createdAt: b.createdAt,
		updatedAt: b.updatedAt,
	}));
}

export async function findByName(
	projectId: string,
	name: string,
): Promise<BucketModel | null> {
	const bucket = await bucketRepo.findByName(projectId, name);
	return dbToModel(bucket);
}

export async function create(
	projectId: string,
	input: CreateBucketInput,
): Promise<
	| { bucket: BucketModel }
	| { error: "project_not_found" | "bucket_exists" | "invalid_name" }
> {
	if (!input.name || !/^[a-z][a-z0-9_-]*$/.test(input.name)) {
		return { error: "invalid_name" };
	}

	const project = await projectRepo.findById(projectId);
	if (!project) return { error: "project_not_found" };

	const existing = await bucketRepo.findByName(projectId, input.name);
	if (existing) return { error: "bucket_exists" };

	const data = input.data ?? [];
	const bucket = await bucketRepo.create({
		projectId,
		name: input.name,
		data: JSON.stringify(data),
	});

	const model = dbToModel(bucket);
	if (!model) {
		throw new Error("Failed to create bucket");
	}
	return { bucket: model };
}

export async function update(
	projectId: string,
	name: string,
	input: UpdateBucketInput,
): Promise<BucketModel | null> {
	const existing = await bucketRepo.findByName(projectId, name);
	if (!existing) return null;

	const bucket = await bucketRepo.update(projectId, name, {
		data: JSON.stringify(input.data),
	});

	return dbToModel(bucket);
}

export async function remove(
	projectId: string,
	name: string,
): Promise<boolean> {
	const existing = await bucketRepo.findByName(projectId, name);
	if (!existing) return false;

	await bucketRepo.remove(projectId, name);
	return true;
}

export async function countByProjectId(projectId: string): Promise<number> {
	return bucketRepo.countByProjectId(projectId);
}
