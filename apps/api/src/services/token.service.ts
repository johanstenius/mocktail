import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { AUTH_CONFIG } from "../config/auth";
import * as tokenRepo from "../repositories/token.repository";

export type TokenPair = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export type AccessTokenPayload = {
	userId: string;
	orgId: string;
};

export type RefreshTokenPayload = {
	userId: string;
	tokenId: string;
};

function getSecret(): Uint8Array {
	return new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
}

export async function generateAccessToken(
	userId: string,
	orgId: string,
): Promise<string> {
	return new SignJWT({ userId, orgId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${AUTH_CONFIG.accessTokenExpiry}s`)
		.sign(getSecret());
}

export async function generateRefreshToken(
	userId: string,
	tokenId: string,
): Promise<string> {
	return new SignJWT({ userId, tokenId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${AUTH_CONFIG.refreshTokenExpiry}s`)
		.sign(getSecret());
}

export async function verifyAccessToken(
	token: string,
): Promise<AccessTokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		if (
			typeof payload.userId === "string" &&
			typeof payload.orgId === "string"
		) {
			return { userId: payload.userId, orgId: payload.orgId };
		}
		return null;
	} catch {
		return null;
	}
}

export async function verifyRefreshToken(
	token: string,
): Promise<RefreshTokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		if (
			typeof payload.userId === "string" &&
			typeof payload.tokenId === "string"
		) {
			return { userId: payload.userId, tokenId: payload.tokenId };
		}
		return null;
	} catch {
		return null;
	}
}

export function generateRefreshTokenId(): string {
	return nanoid(32);
}

export async function generateTokenPair(
	userId: string,
	orgId: string,
): Promise<TokenPair> {
	const tokenId = generateRefreshTokenId();
	const expiresAt = new Date(
		Date.now() + AUTH_CONFIG.refreshTokenExpiry * 1000,
	);

	await tokenRepo.createRefresh({ userId, token: tokenId, expiresAt });

	const [accessToken, refreshToken] = await Promise.all([
		generateAccessToken(userId, orgId),
		generateRefreshToken(userId, tokenId),
	]);

	return {
		accessToken,
		refreshToken,
		expiresIn: AUTH_CONFIG.accessTokenExpiry,
	};
}
