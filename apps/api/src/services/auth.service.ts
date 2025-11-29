import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AUTH_CONFIG } from "../config/auth";
import * as orgMembershipRepo from "../repositories/org-membership.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as refreshTokenRepo from "../repositories/refresh-token.repository";
import * as userRepo from "../repositories/user.repository";
import * as tokenService from "./token.service";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function ensureUniqueOrgSlug(baseSlug: string): Promise<string> {
	let slug = baseSlug || "org";
	let suffix = 0;
	while (await orgRepo.findBySlug(slug)) {
		suffix++;
		slug = `${baseSlug}-${suffix}`;
	}
	return slug;
}

export type TokenPair = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export type AuthResult =
	| { success: true; tokens: TokenPair; userId: string; orgId: string }
	| { success: false; error: string };

export type UserWithOrg = {
	id: string;
	email: string;
	org: {
		id: string;
		name: string;
		slug: string;
		tier: string;
	};
	role: string;
};

export async function register(
	email: string,
	password: string,
	orgName: string,
): Promise<AuthResult> {
	const existing = await userRepo.findByEmail(email);
	if (existing) {
		return { success: false, error: "Email already registered" };
	}

	if (password.length < AUTH_CONFIG.passwordMinLength) {
		return {
			success: false,
			error: `Password must be at least ${AUTH_CONFIG.passwordMinLength} characters`,
		};
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const user = await userRepo.create({ email, passwordHash });

	const baseSlug = slugify(orgName);
	const orgSlug = await ensureUniqueOrgSlug(baseSlug);
	const org = await orgRepo.create({
		name: orgName,
		slug: orgSlug,
		ownerId: user.id,
	});

	await orgMembershipRepo.create({
		userId: user.id,
		orgId: org.id,
		role: "owner",
	});

	const tokens = await generateTokenPair(user.id, org.id);
	return { success: true, tokens, userId: user.id, orgId: org.id };
}

export async function login(
	email: string,
	password: string,
): Promise<AuthResult> {
	const user = await userRepo.findByEmail(email);
	if (!user) {
		return { success: false, error: "Invalid credentials" };
	}

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		return { success: false, error: "Invalid credentials" };
	}

	const membership = await orgMembershipRepo.findByUserId(user.id);
	if (!membership.length) {
		return { success: false, error: "No organization found" };
	}

	const org = membership[0].org;
	const tokens = await generateTokenPair(user.id, org.id);
	return { success: true, tokens, userId: user.id, orgId: org.id };
}

export async function logout(refreshToken: string): Promise<void> {
	const payload = await tokenService.verifyRefreshToken(refreshToken);
	if (payload) {
		await refreshTokenRepo.deleteByToken(payload.tokenId).catch(() => {});
	}
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
	const payload = await tokenService.verifyRefreshToken(refreshToken);
	if (!payload) {
		return { success: false, error: "Invalid refresh token" };
	}

	const storedToken = await refreshTokenRepo.findByToken(payload.tokenId);
	if (!storedToken || storedToken.expiresAt < new Date()) {
		return { success: false, error: "Refresh token expired or revoked" };
	}

	const membership = await orgMembershipRepo.findByUserId(payload.userId);
	if (!membership.length) {
		return { success: false, error: "No organization found" };
	}

	await refreshTokenRepo.deleteByToken(payload.tokenId);

	const org = membership[0].org;
	const tokens = await generateTokenPair(payload.userId, org.id);
	return { success: true, tokens, userId: payload.userId, orgId: org.id };
}

export async function getCurrentUser(
	userId: string,
	orgId: string,
): Promise<UserWithOrg | null> {
	const user = await userRepo.findById(userId);
	if (!user) return null;

	const org = await orgRepo.findById(orgId);
	if (!org) return null;

	const membership = await orgMembershipRepo.findByUserAndOrg(userId, orgId);
	if (!membership) return null;

	return {
		id: user.id,
		email: user.email,
		org: {
			id: org.id,
			name: org.name,
			slug: org.slug,
			tier: org.tier,
		},
		role: membership.role,
	};
}

async function generateTokenPair(
	userId: string,
	orgId: string,
): Promise<TokenPair> {
	const tokenId = tokenService.generateRefreshTokenId();
	const expiresAt = new Date(
		Date.now() + AUTH_CONFIG.refreshTokenExpiry * 1000,
	);

	await refreshTokenRepo.create({ userId, token: tokenId, expiresAt });

	const [accessToken, refreshToken] = await Promise.all([
		tokenService.generateAccessToken(userId, orgId),
		tokenService.generateRefreshToken(userId, tokenId),
	]);

	return {
		accessToken,
		refreshToken,
		expiresIn: AUTH_CONFIG.accessTokenExpiry,
	};
}
