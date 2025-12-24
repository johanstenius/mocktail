import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MocktailError, createHttpClient } from "./http";

describe("http client", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.stubGlobal("fetch", originalFetch);
	});

	describe("createHttpClient", () => {
		it("makes GET request with correct headers", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: "test" }), { status: 200 }),
			);

			const client = createHttpClient("https://api.example.com", "test-key");
			await client.request("/test");

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/test",
				expect.objectContaining({
					method: "GET",
					headers: {
						"X-API-Key": "test-key",
						"Content-Type": "application/json",
					},
				}),
			);
		});

		it("makes POST request with body", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ id: "123" }), { status: 201 }),
			);

			const client = createHttpClient("https://api.example.com", "test-key");
			await client.request("/items", {
				method: "POST",
				body: { name: "test" },
			});

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/items",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ name: "test" }),
				}),
			);
		});

		it("appends query params to URL", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify([]), { status: 200 }),
			);

			const client = createHttpClient("https://api.example.com", "test-key");
			await client.request("/items", {
				query: { limit: 10, offset: 0 },
			});

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/items?limit=10&offset=0",
				expect.anything(),
			);
		});

		it("skips undefined query params", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify([]), { status: 200 }),
			);

			const client = createHttpClient("https://api.example.com", "test-key");
			await client.request("/items", {
				query: { limit: 10, offset: undefined },
			});

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/items?limit=10",
				expect.anything(),
			);
		});

		it("returns parsed JSON response", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ id: "123", name: "test" }), {
					status: 200,
				}),
			);

			const client = createHttpClient("https://api.example.com", "test-key");
			const result = await client.request<{ id: string; name: string }>(
				"/test",
			);

			expect(result).toEqual({ id: "123", name: "test" });
		});

		it("returns undefined for 204 No Content", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(null, { status: 204 }),
			);

			const client = createHttpClient("https://api.example.com", "test-key");
			const result = await client.request("/items/123", { method: "DELETE" });

			expect(result).toBeUndefined();
		});
	});

	describe("error handling", () => {
		it("throws MocktailError on 4xx response", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						error: "Not found",
						code: "NOT_FOUND",
					}),
					{ status: 404 },
				),
			);

			const client = createHttpClient("https://api.example.com", "test-key");

			try {
				await client.request("/items/unknown");
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(MocktailError);
				const error = e as MocktailError;
				expect(error.message).toBe("Not found");
				expect(error.code).toBe("NOT_FOUND");
				expect(error.status).toBe(404);
			}
		});

		it("throws MocktailError with fields on validation error", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						error: "Validation failed",
						code: "VALIDATION_ERROR",
						fields: { name: "Required" },
					}),
					{ status: 400 },
				),
			);

			const client = createHttpClient("https://api.example.com", "test-key");

			try {
				await client.request("/items", { method: "POST", body: {} });
			} catch (e) {
				expect(e).toBeInstanceOf(MocktailError);
				const error = e as MocktailError;
				expect(error.code).toBe("VALIDATION_ERROR");
				expect(error.fields).toEqual({ name: "Required" });
			}
		});

		it("handles non-JSON error response", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(
				new Response("Internal Server Error", {
					status: 500,
					statusText: "Internal Server Error",
				}),
			);

			const client = createHttpClient("https://api.example.com", "test-key");

			try {
				await client.request("/items");
			} catch (e) {
				expect(e).toBeInstanceOf(MocktailError);
				const error = e as MocktailError;
				expect(error.message).toBe("Internal Server Error");
				expect(error.code).toBe("UNKNOWN_ERROR");
				expect(error.status).toBe(500);
			}
		});
	});
});
