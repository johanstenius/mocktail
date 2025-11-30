import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AUTH_CONFIG } from "../config/auth";
import * as orgRepo from "../repositories/organization.repository";
import * as tokenRepo from "../repositories/token.repository";
import * as userRepo from "../repositories/user.repository";
import {
	badRequest,
	conflict,
	forbidden,
	invalidCredentials,
	notFound,
	unauthorized,
} from "../utils/errors";
import { ensureUniqueOrgSlug, slugify } from "../utils/slug";
import * as emailService from "./email.service";
import * as tokenService from "./token.service";

export type TokenPair = tokenService.TokenPair;

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
	emailVerifiedAt: Date | null;
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

	await orgRepo.createMembership({
		userId: user.id,
		orgId: org.id,
		role: "owner",
	});

	await createAndSendVerificationEmail(user.id, email);

	const tokens = await tokenService.generateTokenPair(user.id, org.id);
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

	if (!user.emailVerifiedAt) {
		throw forbidden("Email not verified", "EMAIL_NOT_VERIFIED");
	}

	const membership = await orgRepo.findMembershipsByUserId(user.id);
	if (!membership.length) {
		throw notFound("Organization");
	}

	const org = membership[0].org;
	const tokens = await tokenService.generateTokenPair(user.id, org.id);
	return { tokens, userId: user.id, orgId: org.id };
}

export async function logout(refreshToken: string): Promise<void> {
	const payload = await tokenService.verifyRefreshToken(refreshToken);
	if (payload) {
		await tokenRepo.removeRefreshByToken(payload.tokenId).catch(() => {});
	}
}

export async function refresh(refreshToken: string): Promise<LoginResult> {
	const payload = await tokenService.verifyRefreshToken(refreshToken);
	if (!payload) {
		throw unauthorized("Invalid refresh token");
	}

	const storedToken = await tokenRepo.findRefreshByToken(payload.tokenId);
	if (!storedToken || storedToken.expiresAt < new Date()) {
		throw unauthorized("Refresh token expired or revoked");
	}

	const membership = await orgRepo.findMembershipsByUserId(payload.userId);
	if (!membership.length) {
		throw notFound("Organization");
	}

	await tokenRepo.removeRefreshByToken(payload.tokenId);

	const org = membership[0].org;
	const tokens = await tokenService.generateTokenPair(payload.userId, org.id);
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

	const membership = await orgRepo.findMembershipByUserAndOrg(userId, orgId);
	if (!membership) {
		throw notFound("Membership");
	}

	return {
		id: user.id,
		email: user.email,
		emailVerifiedAt: user.emailVerifiedAt,
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

const PASSWORD_RESET_EXPIRY_HOURS = 1;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

async function createAndSendVerificationEmail(
	userId: string,
	email: string,
): Promise<void> {
	const token = nanoid(32);
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

	await tokenRepo.createEmailVerification({ userId, token, expiresAt });
	await emailService.sendVerificationEmail({ to: email, token });
}

export async function forgotPassword(email: string): Promise<void> {
	const user = await userRepo.findByEmail(email);
	if (!user) {
		return;
	}

	await tokenRepo.removePasswordResetByUserId(user.id);

	const token = nanoid(32);
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

	await tokenRepo.createPasswordReset({ userId: user.id, token, expiresAt });
	await emailService.sendPasswordResetEmail({ to: email, token });
}

export async function resetPassword(
	token: string,
	newPassword: string,
): Promise<void> {
	const resetToken = await tokenRepo.findPasswordResetByToken(token);

	if (!resetToken) {
		throw notFound("Reset token");
	}

	if (resetToken.expiresAt < new Date()) {
		await tokenRepo.removePasswordResetByToken(token);
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

	await tokenRepo.removeEmailVerificationByUserId(userId);

	const token = nanoid(32);
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

	await tokenRepo.createEmailVerification({ userId, token, expiresAt });
	await emailService.sendVerificationEmail({ to: user.email, token });
}

export async function verifyEmail(token: string): Promise<void> {
	const verificationToken = await tokenRepo.findEmailVerificationByToken(token);

	if (!verificationToken) {
		throw notFound("Verification token");
	}

	if (verificationToken.expiresAt < new Date()) {
		await tokenRepo.removeEmailVerificationByToken(token);
		throw badRequest("Verification token has expired");
	}

	await userRepo.verifyEmailWithToken(verificationToken.userId, token);
}
