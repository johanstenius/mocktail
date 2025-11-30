import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { billingRouter } from "./routes/billing";
import { dashboardRouter } from "./routes/dashboard";
import { endpointsRouter } from "./routes/endpoints";
import { importRouter } from "./routes/import";
import { invitesRouter } from "./routes/invites";
import { membersRouter } from "./routes/members";
import { mockRouter } from "./routes/mock";
import { onboardingRouter } from "./routes/onboarding";
import { projectsRouter } from "./routes/projects";
import { requestLogsRouter } from "./routes/request-logs";
import { statisticsRouter } from "./routes/statistics";
import { variantsRouter } from "./routes/variants";

const app = new OpenAPIHono();

// Global error handler
app.onError(errorHandler);

// Middleware
app.use("*", loggerMiddleware());
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes (public)
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
