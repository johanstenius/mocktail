import { randomBytes } from "node:crypto";
import { prisma } from "../repositories/db/prisma";
import { badRequest } from "../utils/errors";
import type { OAuthProvider } from "./oauth.service";

export type OAuthPendingPayload = {
	provider: OAuthProvider;
	oauthId: string;
	email: string;
	name: string;
};

const PENDING_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function generateToken(): string {
	return randomBytes(32).toString("base64url");
}

export async function createOAuthPendingToken(
	payload: OAuthPendingPayload,
): Promise<string> {
	const token = generateToken();
	const expiresAt = new Date(Date.now() + PENDING_TOKEN_EXPIRY_MS);

	await prisma.oAuthPendingToken.create({
		data: {
			token,
			provider: payload.provider,
			oauthId: payload.oauthId,
			email: payload.email,
			name: payload.name,
			expiresAt,
		},
	});

	return token;
}

export async function consumeOAuthPendingToken(
	token: string,
): Promise<OAuthPendingPayload> {
	const pending = await prisma.oAuthPendingToken.findUnique({
		where: { token },
	});

	if (!pending) {
		throw badRequest("Invalid or already used OAuth token");
	}

	if (pending.expiresAt < new Date()) {
		await prisma.oAuthPendingToken.delete({ where: { id: pending.id } });
		throw badRequest("OAuth session expired. Please try again.");
	}

	// Delete token to make it single-use
	await prisma.oAuthPendingToken.delete({ where: { id: pending.id } });

	return {
		provider: pending.provider,
		oauthId: pending.oauthId,
		email: pending.email,
		name: pending.name,
	};
}

// Cleanup expired tokens (call periodically)
export async function cleanupExpiredOAuthTokens(): Promise<number> {
	const result = await prisma.oAuthPendingToken.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
	return result.count;
}
