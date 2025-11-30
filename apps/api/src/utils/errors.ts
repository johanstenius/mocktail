import { HTTPException } from "hono/http-exception";

export function notFound(resource: string): HTTPException {
	return new HTTPException(404, { message: `${resource} not found` });
}

export function badRequest(message: string): HTTPException {
	return new HTTPException(400, { message });
}

export function forbidden(message: string): HTTPException {
	return new HTTPException(403, { message });
}

export function conflict(message: string): HTTPException {
	return new HTTPException(409, { message });
}

export function unauthorized(message = "Unauthorized"): HTTPException {
	return new HTTPException(401, { message });
}
