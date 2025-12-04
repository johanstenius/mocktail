import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { except } from "hono/combine";
import { cors } from "hono/cors";
import { adminRouter } from "./controllers/admin";
import { auditRouter } from "./controllers/audit";
import { billingRouter } from "./controllers/billing";
import { dashboardRouter } from "./controllers/dashboard";
import { endpointsRouter } from "./controllers/endpoints";
import { eventsRouter } from "./controllers/events";
import { importRouter } from "./controllers/import";
import { mockRouter } from "./controllers/mock";
import { projectsRouter } from "./controllers/projects";
import { requestLogsRouter } from "./controllers/request-logs";
import { statisticsRouter } from "./controllers/statistics";
import { variantsRouter } from "./controllers/variants";
import { auth } from "./lib/auth";
import { errorHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { logger } from "./utils/logger";

const app = new OpenAPIHono();

// Global error handler
app.onError(errorHandler);

// Middleware
app.use("*", loggerMiddleware());
app.use(
	"*",
	cors({
		origin: process.env.APP_URL || "http://localhost:3000",
		credentials: true,
	}),
);

// Routes excluded from auth middleware (auth package handles its own session)
const PUBLIC_ROUTES = [
	"/health",
	"/api/docs",
	"/auth/*", // Auth package routes
	"/mock/*", // Mock server (has own API key auth)
	"/admin/*", // Admin routes (has own auth)
	"/api/billing/webhook", // Stripe webhook
	"/api/events/*", // SSE events (auth via cookie)
];

// Auth middleware from package
app.use("*", except(PUBLIC_ROUTES, auth.middleware));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes (from package)
app.route("/auth", auth.routes);

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
app.route("/api", auditRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/events", eventsRouter);

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
