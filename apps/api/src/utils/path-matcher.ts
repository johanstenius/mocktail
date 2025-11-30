type MatchResult = {
	matched: boolean;
	params: Record<string, string>;
};

/**
 * Matches a request path against an endpoint pattern.
 * Supports :param style path parameters.
 *
 * @example
 * matchPath("/users/:id", "/users/123") // { matched: true, params: { id: "123" } }
 * matchPath("/users/:id/posts/:postId", "/users/1/posts/42") // { matched: true, params: { id: "1", postId: "42" } }
 * matchPath("/users", "/posts") // { matched: false, params: {} }
 */
export function matchPath(pattern: string, requestPath: string): MatchResult {
	const patternParts = pattern.split("/").filter(Boolean);
	const requestParts = requestPath.split("/").filter(Boolean);

	if (patternParts.length !== requestParts.length) {
		return { matched: false, params: {} };
	}

	const params: Record<string, string> = {};

	for (let i = 0; i < patternParts.length; i++) {
		const patternPart = patternParts[i];
		const requestPart = requestParts[i];

		if (patternPart.startsWith(":")) {
			const paramName = patternPart.slice(1);
			params[paramName] = requestPart;
		} else if (patternPart !== requestPart) {
			return { matched: false, params: {} };
		}
	}

	return { matched: true, params };
}

/**
 * Finds the best matching endpoint from a list.
 * Prioritizes exact matches over parameterized matches.
 */
export function findBestMatch<T extends { path: string }>(
	endpoints: T[],
	requestPath: string,
): { endpoint: T; params: Record<string, string> } | null {
	let bestMatch: { endpoint: T; params: Record<string, string> } | null = null;
	let bestScore = -1;

	for (const endpoint of endpoints) {
		const result = matchPath(endpoint.path, requestPath);
		if (!result.matched) continue;

		// Score: count non-param segments (exact matches score higher)
		const parts = endpoint.path.split("/").filter(Boolean);
		const score = parts.filter((p) => !p.startsWith(":")).length;

		if (score > bestScore) {
			bestScore = score;
			bestMatch = { endpoint, params: result.params };
		}
	}

	return bestMatch;
}
