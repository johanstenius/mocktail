import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { adminRouter } from "./controllers/admin";
import { authRouter } from "./controllers/auth";
import { billingRouter } from "./controllers/billing";
import { dashboardRouter } from "./controllers/dashboard";
import { endpointsRouter } from "./controllers/endpoints";
import { importRouter } from "./controllers/import";
import { invitesRouter } from "./controllers/invites";
import { membersRouter } from "./controllers/members";
import { mockRouter } from "./controllers/mock";
import { onboardingRouter } from "./controllers/onboarding";
import { projectsRouter } from "./controllers/projects";
import { requestLogsRouter } from "./controllers/request-logs";
import { statisticsRouter } from "./controllers/statistics";
import { variantsRouter } from "./controllers/variants";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";

const app = new OpenAPIHono();

// Global error handler
app.onError(errorHandler);

// Middleware
app.use("*", loggerMiddleware());
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes (public + protected)
app.route("/api/auth", authRouter);

// API routes
app.route("/api/projects", projectsRouter);
app.route("/api/projects/:projectId/endpoints", endpointsRouter);
app.route(
	"/api/projects/:projectId/endpoints/:endpointId/variants",
	variantsRouter,
);
app.route("/api/projects/:projectId/import", importRouter);
app.route("/api/projects/:projectId/logs", requestLogsRouter);
app.route("/api/projects/:projectId/statistics", statisticsRouter);
app.route("/api/billing", billingRouter);
app.route("/api/members", membersRouter);
app.route("/api/invites", invitesRouter);
app.route("/api/onboarding", onboardingRouter);
app.route("/api/dashboard", dashboardRouter);

// Mock server routes
app.route("/mock", mockRouter);

// Admin routes
app.route("/admin", adminRouter);

// OpenAPI docs
app.doc("/api/docs", {
	openapi: "3.0.0",
	info: {
		title: "Mocktail API",
		version: "0.0.1",
	},
});

const port = Number(process.env.PORT) || 4000;
logger.info({ port }, "server started");

serve({
	fetch: app.fetch,
	port,
});

export default app;
