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
import { initCronJobs } from "./cron";
import { type AuthVariables, auth } from "./lib/auth";
import { errorHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { logger } from "./utils/logger";

const app = new OpenAPIHono<{ Variables: AuthVariables }>();

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

// Routes excluded from auth middleware
const PUBLIC_ROUTES = [
	"/health",
	"/docs",
	"/auth/*", // Better-auth routes
	"/mock/*", // Mock server (has own API key auth)
	"/admin/*", // Admin routes (has own auth)
	"/billing/webhook", // Stripe webhook
	"/events/*", // SSE events (auth via token)
];

// Auth middleware - sets user/session on context
app.use(
	"*",
	except(PUBLIC_ROUTES, async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		c.set("user", session?.user ?? null);
		c.set("session", session?.session ?? null);

		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		return next();
	}),
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Better-auth routes
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

// API routes
app.route("/projects", projectsRouter);
app.route("/projects/:projectId/endpoints", endpointsRouter);
app.route(
	"/projects/:projectId/endpoints/:endpointId/variants",
	variantsRouter,
);
app.route("/projects/:projectId/import", importRouter);
app.route("/projects/:projectId/logs", requestLogsRouter);
app.route("/projects/:projectId/statistics", statisticsRouter);
app.route("/billing", billingRouter);
app.route("/", auditRouter);
app.route("/dashboard", dashboardRouter);
app.route("/events", eventsRouter);

// Mock server routes
app.route("/mock", mockRouter);

// Admin routes
app.route("/admin", adminRouter);

// OpenAPI docs
app.doc("/docs", {
	openapi: "3.0.0",
	info: {
		title: "Mockspec API",
		version: "0.0.1",
	},
});

const port = Number(process.env.PORT) || 4000;
logger.info({ port }, "server started");

// Initialize cron jobs
initCronJobs();

serve({
	fetch: app.fetch,
	port,
});

export default app;
