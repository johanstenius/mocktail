import { SignJWT, jwtVerify } from "jose";
import { AUTH_CONFIG } from "../config/auth";
import { badRequest } from "../utils/errors";
import type { OAuthProvider } from "./oauth.service";

export type OAuthPendingPayload = {
	provider: OAuthProvider;
	oauthId: string;
	email: string;
	name: string;
};

type JWTPayload = OAuthPendingPayload & { type: "oauth_pending" };

const PENDING_TOKEN_EXPIRY = 15 * 60; // 15 minutes

function getSecret(): Uint8Array {
	return new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
}

export async function signOAuthPendingToken(
	payload: OAuthPendingPayload,
): Promise<string> {
	const jwtPayload: JWTPayload = { ...payload, type: "oauth_pending" };
	return new SignJWT(jwtPayload as unknown as Record<string, unknown>)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${PENDING_TOKEN_EXPIRY}s`)
		.sign(getSecret());
}

export async function verifyOAuthPendingToken(
	token: string,
): Promise<OAuthPendingPayload> {
	try {
		const { payload } = await jwtVerify(token, getSecret());

		if (payload.type !== "oauth_pending") {
			throw badRequest("Invalid OAuth pending token");
		}

		if (
			typeof payload.provider !== "string" ||
			typeof payload.oauthId !== "string" ||
			typeof payload.email !== "string" ||
			typeof payload.name !== "string"
		) {
			throw badRequest("Invalid OAuth pending token payload");
		}

		return {
			provider: payload.provider as OAuthProvider,
			oauthId: payload.oauthId,
			email: payload.email,
			name: payload.name,
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes("expired")) {
			throw badRequest("OAuth session expired. Please try again.");
		}
		throw badRequest("Invalid OAuth pending token");
	}
}
