import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, idParamSchema } from "./shared";

export const bucketNameParamSchema = z.object({
	id: z.string().openapi({ description: "Project ID" }),
	name: z.string().openapi({ description: "Bucket name" }),
});

export const bucketSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	name: z.string(),
	data: z.array(z.unknown()),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const createBucketSchema = z.object({
	name: z
		.string()
		.min(1)
		.max(50)
		.regex(
			/^[a-z][a-z0-9_-]*$/,
			"Must start with letter, lowercase alphanumeric with _ or -",
		),
	data: z.array(z.unknown()).default([]),
});

export const updateBucketSchema = z.object({
	data: z.array(z.unknown()),
});

export const bucketListSchema = z.object({
	buckets: z.array(bucketSchema),
});

export const listBucketsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Data Buckets"],
	summary: "List buckets",
	request: {
		params: idParamSchema,
	},
	responses: {
		200: {
			description: "List of data buckets",
			content: {
				"application/json": { schema: bucketListSchema },
			},
		},
	},
});

export const getBucketRoute = createRoute({
	method: "get",
	path: "/{name}",
	tags: ["Data Buckets"],
	summary: "Get bucket data",
	request: {
		params: bucketNameParamSchema,
	},
	responses: {
		200: {
			description: "Bucket data",
			content: {
				"application/json": { schema: bucketSchema },
			},
		},
		404: {
			description: "Bucket not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const createBucketRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Data Buckets"],
	summary: "Create bucket",
	request: {
		params: idParamSchema,
		body: {
			content: {
				"application/json": { schema: createBucketSchema },
			},
		},
	},
	responses: {
		201: {
			description: "Bucket created",
			content: {
				"application/json": { schema: bucketSchema },
			},
		},
		400: {
			description: "Invalid name",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
		409: {
			description: "Bucket already exists",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const updateBucketRoute = createRoute({
	method: "put",
	path: "/{name}",
	tags: ["Data Buckets"],
	summary: "Replace bucket data",
	request: {
		params: bucketNameParamSchema,
		body: {
			content: {
				"application/json": { schema: updateBucketSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Bucket updated",
			content: {
				"application/json": { schema: bucketSchema },
			},
		},
		404: {
			description: "Bucket not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const deleteBucketRoute = createRoute({
	method: "delete",
	path: "/{name}",
	tags: ["Data Buckets"],
	summary: "Delete bucket",
	request: {
		params: bucketNameParamSchema,
	},
	responses: {
		204: {
			description: "Bucket deleted",
		},
		404: {
			description: "Bucket not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type BucketResponse = z.infer<typeof bucketSchema>;
export type CreateBucketInput = z.infer<typeof createBucketSchema>;
export type UpdateBucketInput = z.infer<typeof updateBucketSchema>;
