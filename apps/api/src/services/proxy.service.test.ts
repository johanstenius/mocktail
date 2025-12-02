import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxyRequest } from "./proxy.service";

describe("proxy.service", () => {
	describe("proxyRequest", () => {
		describe("URL building", () => {
			it("returns invalid_url error for malformed URL", async () => {
				const result = await proxyRequest(
					"not-a-valid-url",
					{
						method: "GET",
						path: "/test",
						headers: {},
						query: {},
						body: null,
					},
					1000,
				);

				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error).toBe("invalid_url");
				}
			});
		});

		describe("mocked HTTP requests", () => {
			const originalFetch = global.fetch;

			beforeEach(() => {
				vi.stubGlobal("fetch", vi.fn());
			});

			afterEach(() => {
				vi.stubGlobal("fetch", originalFetch);
			});

			it("proxies GET request with query params", async () => {
				vi.mocked(global.fetch).mockResolvedValueOnce(
					new Response(JSON.stringify({ args: { foo: "bar" } }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/get",
						headers: {},
						query: { foo: "bar" },
						body: null,
					},
					10000,
				);

				expect(global.fetch).toHaveBeenCalledWith(
					"https://api.example.com/get?foo=bar",
					expect.objectContaining({
						method: "GET",
						signal: expect.any(AbortSignal),
					}),
				);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.status).toBe(200);
					expect(result.body).toEqual({ args: { foo: "bar" } });
				}
			});

			it("proxies POST request with body", async () => {
				vi.mocked(global.fetch).mockResolvedValueOnce(
					new Response(JSON.stringify({ json: { test: "data" } }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "POST",
						path: "/post",
						headers: { "Content-Type": "application/json" },
						query: {},
						body: { test: "data" },
					},
					10000,
				);

				expect(global.fetch).toHaveBeenCalledWith(
					"https://api.example.com/post",
					expect.objectContaining({
						method: "POST",
						body: JSON.stringify({ test: "data" }),
					}),
				);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.status).toBe(200);
					expect(result.body).toEqual({ json: { test: "data" } });
				}
			});

			it("passes through error status codes", async () => {
				vi.mocked(global.fetch).mockResolvedValueOnce(
					new Response("Internal Server Error", { status: 500 }),
				);

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/status/500",
						headers: {},
						query: {},
						body: null,
					},
					10000,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.status).toBe(500);
				}
			});

			it("tracks duration", async () => {
				vi.mocked(global.fetch).mockImplementationOnce(async () => {
					await new Promise((r) => setTimeout(r, 50));
					return new Response("{}", {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				});

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/get",
						headers: {},
						query: {},
						body: null,
					},
					10000,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.duration).toBeGreaterThanOrEqual(50);
					expect(result.duration).toBeLessThan(1000);
				}
			});

			it("strips internal headers from request", async () => {
				vi.mocked(global.fetch).mockResolvedValueOnce(
					new Response("{}", {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);

				await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/headers",
						headers: {
							"x-api-key": "secret",
							"x-mock-api-key": "secret2",
							"x-custom": "keep-this",
							host: "should-be-stripped",
						},
						query: {},
						body: null,
					},
					10000,
				);

				const fetchCall = vi.mocked(global.fetch).mock.calls[0];
				const requestHeaders = fetchCall[1]?.headers as Record<string, string>;
				expect(requestHeaders["x-api-key"]).toBeUndefined();
				expect(requestHeaders["x-mock-api-key"]).toBeUndefined();
				expect(requestHeaders.host).toBeUndefined();
				expect(requestHeaders["x-custom"]).toBe("keep-this");
			});

			it("returns timeout error on timeout", async () => {
				vi.mocked(global.fetch).mockRejectedValueOnce(
					Object.assign(new Error("Timeout"), { name: "TimeoutError" }),
				);

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/slow",
						headers: {},
						query: {},
						body: null,
					},
					100,
				);

				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error).toBe("timeout");
				}
			});

			it("returns connection_error on fetch failure", async () => {
				vi.mocked(global.fetch).mockRejectedValueOnce(
					new Error("fetch failed: ECONNREFUSED"),
				);

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/test",
						headers: {},
						query: {},
						body: null,
					},
					10000,
				);

				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error).toBe("connection_error");
				}
			});

			it("parses text response when content-type is not json", async () => {
				vi.mocked(global.fetch).mockResolvedValueOnce(
					new Response("Plain text response", {
						status: 200,
						headers: { "Content-Type": "text/plain" },
					}),
				);

				const result = await proxyRequest(
					"https://api.example.com",
					{
						method: "GET",
						path: "/text",
						headers: {},
						query: {},
						body: null,
					},
					10000,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.body).toBe("Plain text response");
				}
			});
		});
	});
});
