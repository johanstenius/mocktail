import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { every, except } from "hono/combine";
import { cors } from "hono/cors";
import { adminRouter } from "./controllers/admin";
import { auditRouter } from "./controllers/audit";
import { authRouter } from "./controllers/auth";
import { billingRouter } from "./controllers/billing";
import { dashboardRouter } from "./controllers/dashboard";
import { endpointsRouter } from "./controllers/endpoints";
import { eventsRouter } from "./controllers/events";
import { importRouter } from "./controllers/import";
import { invitesRouter } from "./controllers/invites";
import { membersRouter } from "./controllers/members";
import { mockRouter } from "./controllers/mock";
import { oauthRouter } from "./controllers/oauth";
import { onboardingRouter } from "./controllers/onboarding";
import { projectsRouter } from "./controllers/projects";
import { requestLogsRouter } from "./controllers/request-logs";
import { statisticsRouter } from "./controllers/statistics";
import { variantsRouter } from "./controllers/variants";
import { authMiddleware, requireVerifiedEmail } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { logger } from "./utils/logger";

const app = new OpenAPIHono();

// Global error handler
app.onError(errorHandler);

// Middleware
app.use("*", loggerMiddleware());
app.use("*", cors());

// Routes excluded from global auth+verified middleware
const PUBLIC_ROUTES = [
	"/health",
	"/api/docs",
	"/auth/*", // OAuth callbacks
	"/mock/*", // Mock server
	"/admin/*", // Admin routes (has own auth)
	// Auth routes (public or auth-only without verified email)
	"/api/auth/register",
	"/api/auth/login",
	"/api/auth/logout",
	"/api/auth/refresh",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/auth/verify-email",
	"/api/auth/me", // Auth only, no verified email
	"/api/auth/send-verification", // Auth only, no verified email
	// Invites (public token routes)
	"/api/invites/token",
	"/api/invites/accept",
	// Billing webhook
	"/api/billing/webhook",
	// OAuth onboarding
	"/api/onboarding/complete-oauth",
	// SSE events (auth via query param)
	"/api/events/*",
];

app.use(
	"*",
	except(PUBLIC_ROUTES, every(authMiddleware(), requireVerifiedEmail())),
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes (public + protected)
app.route("/api/auth", authRouter);
app.route("/auth", oauthRouter);

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
app.route("/api", auditRouter);
app.route("/api/invites", invitesRouter);
app.route("/api/onboarding", onboardingRouter);
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
