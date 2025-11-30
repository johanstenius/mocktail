import * as endpointRepo from "../repositories/endpoint.repository";
import * as orgMembershipRepo from "../repositories/org-membership.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as projectRepo from "../repositories/project.repository";
import * as userRepo from "../repositories/user.repository";
import { conflict } from "../utils/errors";
import { ensureUniqueOrgSlug, slugify } from "../utils/slug";
import {
	type OAuthPendingPayload,
	verifyOAuthPendingToken,
} from "./oauth-pending-token";
import * as tokenService from "./token.service";

export async function createOrganization(userId: string, orgName: string) {
	const existingMembership = await orgMembershipRepo.findByUserId(userId);
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

	await orgMembershipRepo.create({
		userId,
		orgId: org.id,
		role: "owner",
	});

	return {
		org: {
			id: org.id,
			name: org.name,
			slug: org.slug,
		},
	};
}

export async function markComplete(userId: string) {
	await userRepo.markOnboardingComplete(userId);
	return { success: true };
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
		body: JSON.stringify(
			{
				pets: [
					{ id: 1, name: "Max", species: "dog", age: 3, status: "available" },
					{ id: 2, name: "Bella", species: "cat", age: 2, status: "available" },
					{ id: 3, name: "Charlie", species: "dog", age: 5, status: "adopted" },
				],
				total: 3,
			},
			null,
			2,
		),
	},
	{
		method: "GET",
		path: "/pets/:id",
		status: 200,
		body: JSON.stringify(
			{
				id: 1,
				name: "Max",
				species: "dog",
				breed: "Golden Retriever",
				age: 3,
				status: "available",
				description: "Friendly and playful golden retriever",
				createdAt: "2024-01-15T10:30:00Z",
			},
			null,
			2,
		),
	},
	{
		method: "POST",
		path: "/pets",
		status: 201,
		body: JSON.stringify(
			{
				id: 4,
				name: "Luna",
				species: "cat",
				breed: "Siamese",
				age: 1,
				status: "available",
				createdAt: "2024-03-20T14:00:00Z",
			},
			null,
			2,
		),
	},
	{
		method: "PUT",
		path: "/pets/:id",
		status: 200,
		body: JSON.stringify(
			{
				id: 1,
				name: "Max",
				species: "dog",
				breed: "Golden Retriever",
				age: 4,
				status: "adopted",
				updatedAt: "2024-03-21T09:15:00Z",
			},
			null,
			2,
		),
	},
	{
		method: "DELETE",
		path: "/pets/:id",
		status: 204,
		body: "",
	},
	{
		method: "GET",
		path: "/users",
		status: 200,
		body: JSON.stringify(
			{
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
			null,
			2,
		),
	},
	{
		method: "GET",
		path: "/users/:id",
		status: 200,
		body: JSON.stringify(
			{
				id: 1,
				name: "Alice Johnson",
				email: "alice@example.com",
				role: "admin",
				pets: [{ id: 3, name: "Charlie", species: "dog" }],
				createdAt: "2024-01-01T00:00:00Z",
			},
			null,
			2,
		),
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
		orgId,
	});

	let endpointsCreated = 0;
	for (const endpoint of SAMPLE_ENDPOINTS) {
		await endpointRepo.create({
			projectId: project.id,
			method: endpoint.method,
			path: endpoint.path,
			status: endpoint.status,
			headers: JSON.stringify({ "Content-Type": "application/json" }),
			body: endpoint.body,
			bodyType: "json",
			delay: 0,
			failRate: 0,
		});
		endpointsCreated++;
	}

	return {
		project: { id: project.id, name: project.name, slug: project.slug },
		endpointsCreated,
	};
}
