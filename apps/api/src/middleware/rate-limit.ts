import type { Context, Next } from "hono";
import { getLimits } from "../config/limits";
import { rateLimited } from "../utils/errors";
import { getMockTier } from "./mock-auth";

type SlidingWindowEntry = {
	timestamps: number[];
	lastCleanup: number;
};

type AuthRateLimitConfig = {
	ipLimit: number;
	emailLimit?: number;
	getEmail?: (c: Context) => string | undefined;
};

const RATE_LIMIT_STORE = new Map<string, SlidingWindowEntry>();
const WINDOW_MS = 1000; // 1 second sliding window
const CLEANUP_INTERVAL_MS = 60_000; // cleanup stale entries every minute
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupInterval(): void {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(() => {
		const now = Date.now();
		const staleThreshold = now - WINDOW_MS * 2;
		for (const [key, entry] of RATE_LIMIT_STORE) {
			if (entry.lastCleanup < staleThreshold && entry.timestamps.length === 0) {
				RATE_LIMIT_STORE.delete(key);
			}
		}
	}, CLEANUP_INTERVAL_MS);
}

function checkRateLimit(
	key: string,
	limit: number,
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const windowStart = now - WINDOW_MS;

	let entry = RATE_LIMIT_STORE.get(key);
	if (!entry) {
		entry = { timestamps: [], lastCleanup: now };
		RATE_LIMIT_STORE.set(key, entry);
	}

	// Remove timestamps outside the window
	entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
	entry.lastCleanup = now;

	const remaining = Math.max(0, limit - entry.timestamps.length);
	const resetAt = Math.ceil((now + WINDOW_MS) / 1000);

	if (entry.timestamps.length >= limit) {
		return { allowed: false, remaining: 0, resetAt };
	}

	entry.timestamps.push(now);
	return { allowed: true, remaining: remaining - 1, resetAt };
}

function setRateLimitHeaders(
	c: Context,
	limit: number,
	remaining: number,
	resetAt: number,
): void {
	c.header("X-RateLimit-Limit", String(limit));
	c.header("X-RateLimit-Remaining", String(remaining));
	c.header("X-RateLimit-Reset", String(resetAt));
}

function getClientIp(c: Context): string {
	return (
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
		c.req.header("x-real-ip") ||
		"unknown"
	);
}

export function createMockRateLimiter() {
	startCleanupInterval();

	return async function mockRateLimiter(c: Context, next: Next) {
		const tier = getMockTier(c);
		const limits = getLimits(tier);
		const projectId = c.get("mockProjectId") as string;

		const { allowed, remaining, resetAt } = checkRateLimit(
			`project:${projectId}`,
			limits.rateLimit,
		);
		setRateLimitHeaders(c, limits.rateLimit, remaining, resetAt);

		if (!allowed) {
			c.header("Retry-After", String(1));
			throw rateLimited();
		}

		await next();
	};
}

export function createAuthRateLimiter(config: AuthRateLimitConfig) {
	startCleanupInterval();

	return async function authRateLimiter(c: Context, next: Next) {
		const ip = getClientIp(c);
		const ipKey = `auth:ip:${c.req.path}:${ip}`;

		const ipCheck = checkRateLimitWithWindow(
			ipKey,
			config.ipLimit,
			AUTH_WINDOW_MS,
		);

		if (!ipCheck.allowed) {
			setRateLimitHeaders(c, config.ipLimit, 0, ipCheck.resetAt);
			c.header("Retry-After", String(Math.ceil(AUTH_WINDOW_MS / 1000)));
			throw rateLimited("Too many requests. Please try again later.");
		}

		if (config.emailLimit && config.getEmail) {
			const email = config.getEmail(c);
			if (email) {
				const emailKey = `auth:email:${c.req.path}:${email.toLowerCase()}`;
				const emailCheck = checkRateLimitWithWindow(
					emailKey,
					config.emailLimit,
					AUTH_WINDOW_MS,
				);

				if (!emailCheck.allowed) {
					setRateLimitHeaders(c, config.emailLimit, 0, emailCheck.resetAt);
					c.header("Retry-After", String(Math.ceil(AUTH_WINDOW_MS / 1000)));
					throw rateLimited("Too many requests. Please try again later.");
				}
			}
		}

		setRateLimitHeaders(c, config.ipLimit, ipCheck.remaining, ipCheck.resetAt);

		await next();
	};
}

function checkRateLimitWithWindow(
	key: string,
	limit: number,
	windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const windowStart = now - windowMs;

	let entry = RATE_LIMIT_STORE.get(key);
	if (!entry) {
		entry = { timestamps: [], lastCleanup: now };
		RATE_LIMIT_STORE.set(key, entry);
	}

	entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
	entry.lastCleanup = now;

	const remaining = Math.max(0, limit - entry.timestamps.length);
	const resetAt = Math.ceil((now + windowMs) / 1000);

	if (entry.timestamps.length >= limit) {
		return { allowed: false, remaining: 0, resetAt };
	}

	entry.timestamps.push(now);
	return { allowed: true, remaining: remaining - 1, resetAt };
}

export function checkAuthEmailRateLimit(
	path: string,
	email: string,
	limit: number,
): { allowed: boolean; remaining: number; resetAt: number } {
	startCleanupInterval();
	const key = `auth:email:${path}:${email.toLowerCase()}`;
	return checkRateLimitWithWindow(key, limit, AUTH_WINDOW_MS);
}

// TODO: Replace with Redis for multi-instance deployment
export { RATE_LIMIT_STORE as rateLimitStore };
