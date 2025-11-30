import { describe, expect, it } from "vitest";
import { findBestMatch, matchPath } from "./path-matcher";

describe("matchPath", () => {
	it("matches exact paths", () => {
		expect(matchPath("/users", "/users")).toEqual({
			matched: true,
			params: {},
		});
	});

	it("matches paths with single param", () => {
		expect(matchPath("/users/:id", "/users/123")).toEqual({
			matched: true,
			params: { id: "123" },
		});
	});

	it("matches paths with multiple params", () => {
		expect(matchPath("/users/:id/posts/:postId", "/users/1/posts/42")).toEqual({
			matched: true,
			params: { id: "1", postId: "42" },
		});
	});

	it("does not match different segment counts", () => {
		expect(matchPath("/users/:id", "/users/123/extra")).toEqual({
			matched: false,
			params: {},
		});
	});

	it("does not match different static segments", () => {
		expect(matchPath("/users/:id", "/posts/123")).toEqual({
			matched: false,
			params: {},
		});
	});

	it("handles root path", () => {
		expect(matchPath("/", "/")).toEqual({
			matched: true,
			params: {},
		});
	});

	it("handles trailing slashes consistently", () => {
		expect(matchPath("/users", "/users/")).toEqual({
			matched: true,
			params: {},
		});
	});
});

describe("findBestMatch", () => {
	it("returns null when no endpoints match", () => {
		const endpoints = [{ path: "/users/:id" }, { path: "/posts" }];
		expect(findBestMatch(endpoints, "/items/123")).toBeNull();
	});

	it("returns exact match over param match", () => {
		const endpoints = [{ path: "/users/:id" }, { path: "/users/me" }];
		const result = findBestMatch(endpoints, "/users/me");
		expect(result?.endpoint.path).toBe("/users/me");
		expect(result?.params).toEqual({});
	});

	it("returns param match when no exact match exists", () => {
		const endpoints = [{ path: "/users/:id" }, { path: "/users/me" }];
		const result = findBestMatch(endpoints, "/users/123");
		expect(result?.endpoint.path).toBe("/users/:id");
		expect(result?.params).toEqual({ id: "123" });
	});

	it("prefers more specific paths", () => {
		const endpoints = [
			{ path: "/users/:id/posts/:postId" },
			{ path: "/users/:id/posts/latest" },
		];
		const result = findBestMatch(endpoints, "/users/1/posts/latest");
		expect(result?.endpoint.path).toBe("/users/:id/posts/latest");
	});
});
