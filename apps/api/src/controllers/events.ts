import { OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { eventBus } from "../events/event-bus";
import type { SSEEvent } from "../events/types";
import { auth } from "../lib/auth";
import * as projectRepo from "../repositories/project.repository";
import * as sessionRepo from "../repositories/session.repository";
import { subscribeEventsRoute } from "../schemas/events";
import * as statisticsService from "../services/statistics.service";
import { forbidden, unauthorized } from "../utils/errors";
import { logger } from "../utils/logger";

export const eventsRouter = new OpenAPIHono();

const KEEPALIVE_INTERVAL_MS = 30_000;

eventsRouter.openapi(subscribeEventsRoute, async (c) => {
	const { scope, scopeId } = c.req.valid("param");

	// Auth via cookies (same as other routes)
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		throw unauthorized("Not authenticated");
	}

	const activeOrgId = (session.session as { activeOrganizationId?: string })
		.activeOrganizationId;
	if (!activeOrgId) {
		throw forbidden("No active organization");
	}

	const membership = await sessionRepo.findMembershipByOrgAndUser(
		activeOrgId,
		session.user.id,
	);
	if (!membership) {
		throw forbidden("Not a member of this organization");
	}

	if (scope === "project") {
		const project = await projectRepo.findById(scopeId);
		if (!project || project.orgId !== activeOrgId) {
			throw forbidden("No access to this project");
		}
	} else if (scope === "org") {
		if (scopeId !== activeOrgId) {
			throw forbidden("No access to this organization");
		}
	} else if (scope === "user") {
		if (scopeId !== session.user.id) {
			throw forbidden("No access to this user's events");
		}
	}

	return streamSSE(c, async (stream) => {
		let subscriptionId: string | null = null;

		const handler = (event: SSEEvent) => {
			stream.writeSSE({
				event: event.type,
				data: JSON.stringify(event),
			});
		};

		subscriptionId = eventBus.subscribe(scope, scopeId, handler);

		logger.debug({ scope, scopeId, subscriptionId }, "SSE client connected");

		if (scope === "project") {
			const stats = await statisticsService.getProjectStatistics(scopeId);
			if (stats) {
				await stream.writeSSE({
					event: "stats.initial",
					data: JSON.stringify({
						type: "stats.initial",
						scope,
						scopeId,
						payload: stats,
						timestamp: new Date().toISOString(),
					}),
				});
			}
		}

		const keepaliveInterval = setInterval(() => {
			stream.writeSSE({ event: "keepalive", data: "" });
		}, KEEPALIVE_INTERVAL_MS);

		stream.onAbort(() => {
			logger.debug(
				{ scope, scopeId, subscriptionId },
				"SSE client disconnected",
			);
			clearInterval(keepaliveInterval);
			if (subscriptionId) {
				eventBus.unsubscribe(subscriptionId);
			}
		});

		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	});
});
