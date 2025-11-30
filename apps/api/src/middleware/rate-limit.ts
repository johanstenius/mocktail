import type { Context, Next } from "hono";
import { UNAUTHENTICATED_RATE_LIMIT, getLimits } from "../config/limits";
import { rateLimited } from "../utils/errors";
import { getMockTier } from "./mock-auth";

type SlidingWindowEntry = {
	timestamps: number[];
	lastCleanup: number;
};

const rateLimitStore = new Map<string, SlidingWindowEntry>();
const WINDOW_MS = 1000; // 1 second sliding window
const CLEANUP_INTERVAL_MS = 60_000; // cleanup stale entries every minute

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupInterval(): void {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(() => {
		const now = Date.now();
		const staleThreshold = now - WINDOW_MS * 2;
		for (const [key, entry] of rateLimitStore) {
			if (entry.lastCleanup < staleThreshold && entry.timestamps.length === 0) {
				rateLimitStore.delete(key);
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

	let entry = rateLimitStore.get(key);
	if (!entry) {
		entry = { timestamps: [], lastCleanup: now };
		rateLimitStore.set(key, entry);
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

// TODO: Replace with Redis for multi-instance deployment
export { rateLimitStore };
