import { OpenAPIHono } from "@hono/zod-openapi";
import { authMiddleware, getAuth } from "../middleware/auth";
import {
	completeOnboardingRoute,
	createSampleProjectRoute,
} from "../schemas/onboarding";
import * as onboardingService from "../services/onboarding.service";

export const onboardingRouter = new OpenAPIHono();

onboardingRouter.use("*", authMiddleware());

onboardingRouter.openapi(completeOnboardingRoute, async (c) => {
	const { userId } = getAuth(c);
	const result = await onboardingService.markComplete(userId);
	return c.json(result);
});

onboardingRouter.openapi(createSampleProjectRoute, async (c) => {
	const { orgId } = getAuth(c);
	const result = await onboardingService.createSampleProject(orgId);
	return c.json(result, 201);
});
