import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AUTH_CONFIG } from "../config/auth";
import * as emailVerificationRepo from "../repositories/email-verification.repository";
import * as orgMembershipRepo from "../repositories/org-membership.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as passwordResetRepo from "../repositories/password-reset.repository";
import * as refreshTokenRepo from "../repositories/refresh-token.repository";
import * as userRepo from "../repositories/user.repository";
import {
	badRequest,
	conflict,
	invalidCredentials,
	notFound,
	unauthorized,
} from "../utils/errors";
import * as emailService from "./email.service";
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

export type RegisterResult = {
	tokens: TokenPair;
	userId: string;
	orgId: string;
};

export type LoginResult = {
	tokens: TokenPair;
	userId: string;
	orgId: string;
};

export type UserWithOrg = {
	id: string;
	email: string;
	hasCompletedOnboarding: boolean;
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
): Promise<RegisterResult> {
	const existing = await userRepo.findByEmail(email);
	if (existing) {
		throw conflict("Email already registered");
	}

	if (password.length < AUTH_CONFIG.passwordMinLength) {
		throw badRequest(
			`Password must be at least ${AUTH_CONFIG.passwordMinLength} characters`,
		);
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
	return { tokens, userId: user.id, orgId: org.id };
}

export async function login(
	email: string,
	password: string,
): Promise<LoginResult> {
	const user = await userRepo.findByEmail(email);
	if (!user) {
		throw invalidCredentials();
	}

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		throw invalidCredentials();
	}

	const membership = await orgMembershipRepo.findByUserId(user.id);
	if (!membership.length) {
		throw notFound("Organization");
	}

	const org = membership[0].org;
	const tokens = await generateTokenPair(user.id, org.id);
	return { tokens, userId: user.id, orgId: org.id };
}

export async function logout(refreshToken: string): Promise<void> {
	const payload = await tokenService.verifyRefreshToken(refreshToken);
	if (payload) {
		await refreshTokenRepo.deleteByToken(payload.tokenId).catch(() => {});
	}
}

export async function refresh(refreshToken: string): Promise<LoginResult> {
	const payload = await tokenService.verifyRefreshToken(refreshToken);
	if (!payload) {
		throw unauthorized("Invalid refresh token");
	}

	const storedToken = await refreshTokenRepo.findByToken(payload.tokenId);
	if (!storedToken || storedToken.expiresAt < new Date()) {
		throw unauthorized("Refresh token expired or revoked");
	}

	const membership = await orgMembershipRepo.findByUserId(payload.userId);
	if (!membership.length) {
		throw notFound("Organization");
	}

	await refreshTokenRepo.deleteByToken(payload.tokenId);

	const org = membership[0].org;
	const tokens = await generateTokenPair(payload.userId, org.id);
	return { tokens, userId: payload.userId, orgId: org.id };
}

export async function getCurrentUser(
	userId: string,
	orgId: string,
): Promise<UserWithOrg> {
	const user = await userRepo.findById(userId);
	if (!user) {
		throw notFound("User");
	}

	const org = await orgRepo.findById(orgId);
	if (!org) {
		throw notFound("Organization");
	}

	const membership = await orgMembershipRepo.findByUserAndOrg(userId, orgId);
	if (!membership) {
		throw notFound("Membership");
	}

	return {
		id: user.id,
		email: user.email,
		hasCompletedOnboarding: user.hasCompletedOnboarding,
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

const PASSWORD_RESET_EXPIRY_HOURS = 1;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

export async function forgotPassword(email: string): Promise<void> {
	const user = await userRepo.findByEmail(email);
	if (!user) {
		return;
	}

	await passwordResetRepo.deleteByUserId(user.id);

	const token = nanoid(32);
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

	await passwordResetRepo.create({ userId: user.id, token, expiresAt });
	await emailService.sendPasswordResetEmail({ to: email, token });
}

export async function resetPassword(
	token: string,
	newPassword: string,
): Promise<void> {
	const resetToken = await passwordResetRepo.findByToken(token);

	if (!resetToken) {
		throw notFound("Reset token");
	}

	if (resetToken.expiresAt < new Date()) {
		await passwordResetRepo.deleteByToken(token);
		throw badRequest("Reset token has expired");
	}

	if (newPassword.length < AUTH_CONFIG.passwordMinLength) {
		throw badRequest(
			`Password must be at least ${AUTH_CONFIG.passwordMinLength} characters`,
		);
	}

	const passwordHash = await bcrypt.hash(newPassword, 10);
	await userRepo.resetPasswordWithToken(resetToken.userId, passwordHash, token);
}

export async function sendVerificationEmail(userId: string): Promise<void> {
	const user = await userRepo.findById(userId);
	if (!user) {
		throw notFound("User");
	}

	if (user.emailVerifiedAt) {
		throw badRequest("Email already verified");
	}

	await emailVerificationRepo.deleteByUserId(userId);

	const token = nanoid(32);
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

	await emailVerificationRepo.create({ userId, token, expiresAt });
	await emailService.sendVerificationEmail({ to: user.email, token });
}

export async function verifyEmail(token: string): Promise<void> {
	const verificationToken = await emailVerificationRepo.findByToken(token);

	if (!verificationToken) {
		throw notFound("Verification token");
	}

	if (verificationToken.expiresAt < new Date()) {
		await emailVerificationRepo.deleteByToken(token);
		throw badRequest("Verification token has expired");
	}

	await userRepo.verifyEmailWithToken(verificationToken.userId, token);
}
