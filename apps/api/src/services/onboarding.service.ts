import { nanoid } from "nanoid";
import * as endpointRepo from "../repositories/endpoint.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as projectRepo from "../repositories/project.repository";
import * as userRepo from "../repositories/user.repository";
import * as variantRepo from "../repositories/variant.repository";
import { conflict } from "../utils/errors";
import { ensureUniqueOrgSlug, slugify } from "../utils/slug";
import * as auditService from "./audit.service";
import type { AuditContext } from "./audit.service";
import {
	type OAuthPendingPayload,
	verifyOAuthPendingToken,
} from "./oauth-pending-token";
import * as tokenService from "./token.service";

export async function createOrganization(
	userId: string,
	orgName: string,
	ctx?: AuditContext,
) {
	const existingMembership = await orgRepo.findMembershipsByUserId(userId);
	if (existingMembership.length > 0) {
		throw conflict("User already has an organization");
	}

	const baseSlug = slugify(orgName);
	const slug = await ensureUniqueOrgSlug(baseSlug);
	const org = await orgRepo.create({
		name: orgName,
		slug,
		ownerId: userId,
	});

	await orgRepo.createMembership({
		userId,
		orgId: org.id,
		role: "owner",
	});

	await auditService.log({
		orgId: org.id,
		action: "org_created",
		targetType: "org",
		targetId: org.id,
		metadata: { name: org.name, slug: org.slug },
		ctx: { ...ctx, actorId: userId },
	});

	return {
		org: {
			id: org.id,
			name: org.name,
			slug: org.slug,
		},
	};
}

export async function markComplete(userId: string): Promise<void> {
	await userRepo.markOnboardingComplete(userId);
}

export type CompleteOAuthOnboardingResult = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: { id: string; email: string };
	org: { id: string; name: string; slug: string };
};

export async function completeOAuthOnboarding(
	oauthToken: string,
	organizationName: string,
	ctx?: AuditContext,
): Promise<CompleteOAuthOnboardingResult> {
	const payload = await verifyOAuthPendingToken(oauthToken);

	const baseSlug = slugify(organizationName);
	const slug = await ensureUniqueOrgSlug(baseSlug);

	const result = await userRepo.createOAuthUserWithOrg({
		email: payload.email,
		name: payload.name,
		oauthProvider: payload.provider,
		oauthId: payload.oauthId,
		orgName: organizationName,
		orgSlug: slug,
	});

	if ("error" in result) {
		throw conflict("Email already registered");
	}

	const { user, org } = result;

	await auditService.log({
		orgId: org.id,
		action: "org_created",
		targetType: "org",
		targetId: org.id,
		metadata: { name: org.name, slug: org.slug },
		ctx: { ...ctx, actorId: user.id },
	});

	const tokens = await tokenService.generateTokenPair(user.id, org.id);

	return {
		...tokens,
		user: { id: user.id, email: user.email },
		org: { id: org.id, name: org.name, slug: org.slug },
	};
}

const SAMPLE_PROJECT_SLUG = "petstore-demo";

const SAMPLE_ENDPOINTS = [
	{
		method: "GET",
		path: "/pets",
		status: 200,
		body: {
			pets: [
				{ id: 1, name: "Max", species: "dog", age: 3, status: "available" },
				{ id: 2, name: "Bella", species: "cat", age: 2, status: "available" },
				{ id: 3, name: "Charlie", species: "dog", age: 5, status: "adopted" },
			],
			total: 3,
		},
	},
	{
		method: "GET",
		path: "/pets/:id",
		status: 200,
		body: {
			id: 1,
			name: "Max",
			species: "dog",
			breed: "Golden Retriever",
			age: 3,
			status: "available",
			description: "Friendly and playful golden retriever",
			createdAt: "2024-01-15T10:30:00Z",
		},
	},
	{
		method: "POST",
		path: "/pets",
		status: 201,
		body: {
			id: 4,
			name: "Luna",
			species: "cat",
			breed: "Siamese",
			age: 1,
			status: "available",
			createdAt: "2024-03-20T14:00:00Z",
		},
	},
	{
		method: "PUT",
		path: "/pets/:id",
		status: 200,
		body: {
			id: 1,
			name: "Max",
			species: "dog",
			breed: "Golden Retriever",
			age: 4,
			status: "adopted",
			updatedAt: "2024-03-21T09:15:00Z",
		},
	},
	{
		method: "DELETE",
		path: "/pets/:id",
		status: 204,
		body: null,
	},
	{
		method: "GET",
		path: "/users",
		status: 200,
		body: {
			users: [
				{
					id: 1,
					name: "Alice Johnson",
					email: "alice@example.com",
					role: "admin",
				},
				{
					id: 2,
					name: "Bob Smith",
					email: "bob@example.com",
					role: "customer",
				},
			],
			total: 2,
		},
	},
	{
		method: "GET",
		path: "/users/:id",
		status: 200,
		body: {
			id: 1,
			name: "Alice Johnson",
			email: "alice@example.com",
			role: "admin",
			pets: [{ id: 3, name: "Charlie", species: "dog" }],
			createdAt: "2024-01-01T00:00:00Z",
		},
	},
];

async function generateUniqueProjectSlug(baseSlug: string, orgId: string) {
	let slug = baseSlug;
	let suffix = 0;
	while (await projectRepo.findBySlugAndOrgId(slug, orgId)) {
		suffix++;
		slug = `${baseSlug}-${suffix}`;
	}
	return slug;
}

export type SampleProjectResult = {
	project: { id: string; name: string; slug: string };
	endpointsCreated: number;
};

export async function createSampleProject(
	orgId: string,
): Promise<SampleProjectResult> {
	const slug = await generateUniqueProjectSlug(SAMPLE_PROJECT_SLUG, orgId);

	const project = await projectRepo.create({
		name: "Petstore Demo",
		slug,
		apiKey: `mk_${nanoid(24)}`,
		orgId,
	});

	let endpointsCreated = 0;
	for (const ep of SAMPLE_ENDPOINTS) {
		const endpoint = await endpointRepo.create({
			projectId: project.id,
			method: ep.method,
			path: ep.path,
		});

		await variantRepo.create({
			endpointId: endpoint.id,
			name: "Default",
			priority: 0,
			isDefault: true,
			status: ep.status,
			headers: { "Content-Type": "application/json" },
			body: ep.body ?? {},
			bodyType: "static",
			delay: 0,
			failRate: 0,
			rules: [],
			ruleLogic: "and",
		});
		endpointsCreated++;
	}

	return {
		project: { id: project.id, name: project.name, slug: project.slug },
		endpointsCreated,
	};
}
