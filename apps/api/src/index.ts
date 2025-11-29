import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRouter } from "./routes/auth";
import { endpointsRouter } from "./routes/endpoints";
import { importRouter } from "./routes/import";
import { mockRouter } from "./routes/mock";
import { projectsRouter } from "./routes/projects";
import { requestLogsRouter } from "./routes/request-logs";
import { statisticsRouter } from "./routes/statistics";

const app = new OpenAPIHono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes (public)
app.route("/api/auth", authRouter);

// API routes
app.route("/api/projects", projectsRouter);
app.route("/api/projects/:projectId/endpoints", endpointsRouter);
app.route("/api/projects/:projectId/import", importRouter);
app.route("/api/projects/:projectId/logs", requestLogsRouter);
app.route("/api/projects/:projectId/statistics", statisticsRouter);

// Mock server routes
app.route("/mock", mockRouter);

// OpenAPI docs
app.doc("/api/docs", {
	openapi: "3.0.0",
	info: {
		title: "Mocktail API",
		version: "0.0.1",
	},
});

const port = Number(process.env.PORT) || 4000;
console.log(`Server running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});

export default app;
