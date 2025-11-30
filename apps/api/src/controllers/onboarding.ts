import { OpenAPIHono } from "@hono/zod-openapi";
import {
	authMiddleware,
	getAuth,
	requireVerifiedEmail,
} from "../middleware/auth";
import {
	completeOAuthOnboardingRoute,
	completeOnboardingRoute,
	createOrganizationRoute,
	createSampleProjectRoute,
} from "../schemas/onboarding";
import * as onboardingService from "../services/onboarding.service";

export const onboardingRouter = new OpenAPIHono();

// Public route - no auth needed (uses OAuth pending token)
onboardingRouter.openapi(completeOAuthOnboardingRoute, async (c) => {
	const { oauthToken, organizationName } = c.req.valid("json");
	const result = await onboardingService.completeOAuthOnboarding(
		oauthToken,
		organizationName,
	);
	return c.json(result, 201);
});

// Protected routes
onboardingRouter.use("*", authMiddleware(), requireVerifiedEmail());

onboardingRouter.openapi(createOrganizationRoute, async (c) => {
	const { userId } = getAuth(c);
	const { name } = c.req.valid("json");
	const result = await onboardingService.createOrganization(userId, name);
	return c.json(result, 201);
});

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
