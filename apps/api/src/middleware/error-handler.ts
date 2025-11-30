import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { ErrorCode } from "../utils/errors";

type PrismaError = Error & { code?: string };

type ErrorResponse = {
	error: string;
	code: string;
	fields?: Record<string, string>;
};

export const errorHandler: ErrorHandler = (err, c) => {
	// Zod validation errors
	if (err instanceof ZodError) {
		const fields: Record<string, string> = {};
		for (const issue of err.issues) {
			const path = issue.path.join(".") || "value";
			fields[path] = issue.message;
		}
		return c.json<ErrorResponse>(
			{
				error: "Validation failed",
				code: ErrorCode.VALIDATION_ERROR,
				fields,
			},
			400,
		);
	}

	// HTTPException (our custom errors)
	if (err instanceof HTTPException) {
		const cause = err.cause as { code?: string } | undefined;
		return c.json<ErrorResponse>(
			{
				error: err.message,
				code: cause?.code ?? ErrorCode.BAD_REQUEST,
			},
			err.status,
		);
	}

	// Prisma errors
	const prismaErr = err as PrismaError;
	if (prismaErr.code === "P2002") {
		return c.json<ErrorResponse>(
			{
				error: "Resource already exists",
				code: ErrorCode.CONFLICT,
			},
			409,
		);
	}
	if (prismaErr.code === "P2025") {
		return c.json<ErrorResponse>(
			{
				error: "Resource not found",
				code: ErrorCode.NOT_FOUND,
			},
			404,
		);
	}

	// Unknown error
	console.error("Unhandled error:", err);
	return c.json<ErrorResponse>(
		{
			error: "Internal server error",
			code: ErrorCode.INTERNAL_ERROR,
		},
		500,
	);
};
