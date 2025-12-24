import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Mocktail } from "./client";

describe("Mocktail client", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.stubGlobal("fetch", originalFetch);
	});

	describe("constructor", () => {
		it("uses default base URL when not provided", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ projects: [] }), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			await client.projects.list();

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.mockspec.dev/projects",
				expect.anything(),
			);
		});

		it("uses custom base URL when provided", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ projects: [] }), { status: 200 }),
			);

			const client = new Mocktail({
				apiKey: "ms_org_xxx",
				baseUrl: "http://localhost:4000",
			});
			await client.projects.list();

			expect(global.fetch).toHaveBeenCalledWith(
				"http://localhost:4000/projects",
				expect.anything(),
			);
		});
	});

	describe("projects resource", () => {
		it("lists projects", async () => {
			const mockProjects = [
				{ id: "1", name: "Project 1", slug: "project-1" },
				{ id: "2", name: "Project 2", slug: "project-2" },
			];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ projects: mockProjects }), {
					status: 200,
				}),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const projects = await client.projects.list();

			expect(projects).toEqual(mockProjects);
		});

		it("creates project", async () => {
			const mockProject = { id: "1", name: "New Project", slug: "new-project" };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockProject), { status: 201 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const project = await client.projects.create({
				name: "New Project",
				slug: "new-project",
			});

			expect(project).toEqual(mockProject);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ name: "New Project", slug: "new-project" }),
				}),
			);
		});

		it("gets project by id", async () => {
			const mockProject = { id: "1", name: "Project 1", slug: "project-1" };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockProject), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const project = await client.projects.get("1");

			expect(project).toEqual(mockProject);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/1"),
				expect.anything(),
			);
		});

		it("updates project", async () => {
			const mockProject = { id: "1", name: "Updated", slug: "project-1" };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockProject), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const project = await client.projects.update("1", { name: "Updated" });

			expect(project).toEqual(mockProject);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/1"),
				expect.objectContaining({ method: "PATCH" }),
			);
		});

		it("deletes project", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(null, { status: 204 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			await client.projects.delete("1");

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/1"),
				expect.objectContaining({ method: "DELETE" }),
			);
		});
	});

	describe("endpoints resource", () => {
		it("lists endpoints for project", async () => {
			const mockEndpoints = [
				{ id: "e1", method: "GET", path: "/users" },
				{ id: "e2", method: "POST", path: "/users" },
			];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ endpoints: mockEndpoints }), {
					status: 200,
				}),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const endpoints = await client.endpoints.list("proj-1");

			expect(endpoints).toEqual(mockEndpoints);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/proj-1/endpoints"),
				expect.anything(),
			);
		});

		it("creates endpoint", async () => {
			const mockEndpoint = { id: "e1", method: "GET", path: "/users" };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockEndpoint), { status: 201 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const endpoint = await client.endpoints.create("proj-1", {
				method: "GET",
				path: "/users",
			});

			expect(endpoint).toEqual(mockEndpoint);
		});
	});

	describe("variants resource", () => {
		it("lists variants for endpoint", async () => {
			const mockVariants = [
				{ id: "v1", name: "Success", status: 200 },
				{ id: "v2", name: "Error", status: 500 },
			];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ variants: mockVariants }), {
					status: 200,
				}),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const variants = await client.variants.list("proj-1", "ep-1");

			expect(variants).toEqual(mockVariants);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/proj-1/endpoints/ep-1/variants"),
				expect.anything(),
			);
		});

		it("reorders variants", async () => {
			const mockVariants = [
				{ id: "v2", priority: 1 },
				{ id: "v1", priority: 2 },
			];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ variants: mockVariants }), {
					status: 200,
				}),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const variants = await client.variants.reorder("proj-1", "ep-1", [
				"v2",
				"v1",
			]);

			expect(variants).toEqual(mockVariants);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/variants/reorder"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ variantIds: ["v2", "v1"] }),
				}),
			);
		});
	});

	describe("buckets resource", () => {
		it("lists buckets", async () => {
			const mockBuckets = [{ id: "b1", name: "users", data: [] }];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ buckets: mockBuckets }), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const buckets = await client.buckets.list("proj-1");

			expect(buckets).toEqual(mockBuckets);
		});

		it("sets bucket data", async () => {
			const mockBucket = { id: "b1", name: "users", data: [{ id: 1 }] };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockBucket), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const bucket = await client.buckets.set("proj-1", "users", [{ id: 1 }]);

			expect(bucket).toEqual(mockBucket);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/proj-1/buckets/users"),
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify({ data: [{ id: 1 }] }),
				}),
			);
		});
	});

	describe("logs resource", () => {
		it("lists logs with filters", async () => {
			const mockLogs = [{ id: "l1", method: "GET", path: "/users" }];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ logs: mockLogs, total: 1 }), {
					status: 200,
				}),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const result = await client.logs.list("proj-1", {
				limit: 10,
				method: "GET",
			});

			expect(result.logs).toEqual(mockLogs);
			expect(result.total).toBe(1);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/proj-1/logs?limit=10&method=GET"),
				expect.anything(),
			);
		});

		it("clears logs", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ deleted: 50 }), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const result = await client.logs.clear("proj-1");

			expect(result.deleted).toBe(50);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/proj-1/logs"),
				expect.objectContaining({ method: "DELETE" }),
			);
		});
	});

	describe("project() scoped client", () => {
		it("provides project-scoped endpoints", async () => {
			const mockEndpoints = [{ id: "e1", method: "GET", path: "/users" }];
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ endpoints: mockEndpoints }), {
					status: 200,
				}),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const proj = client.project("proj-1");
			const endpoints = await proj.endpoints.list();

			expect(endpoints).toEqual(mockEndpoints);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/projects/proj-1/endpoints"),
				expect.anything(),
			);
		});

		it("provides project-scoped buckets", async () => {
			const mockBucket = { id: "b1", name: "users", data: [] };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockBucket), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const proj = client.project("proj-1");
			const bucket = await proj.buckets.get("users");

			expect(bucket).toEqual(mockBucket);
		});

		it("provides project-scoped stats", async () => {
			const mockStats = { endpoints: [], unmatched: [], avgLatency: 50 };
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify(mockStats), { status: 200 }),
			);

			const client = new Mocktail({ apiKey: "ms_org_xxx" });
			const proj = client.project("proj-1");
			const stats = await proj.stats.get();

			expect(stats).toEqual(mockStats);
		});
	});
});
