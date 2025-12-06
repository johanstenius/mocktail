import { NotFoundPage } from "@/components/not-found-page";
import { Sidebar } from "@/components/sidebar";
import {
	organization,
	useActiveOrganization,
	useListOrganizations,
	useSession,
} from "@/lib/auth-client";
import {
	Navigate,
	Outlet,
	createRootRoute,
	useLocation,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createRootRoute({
	component: RootLayout,
	notFoundComponent: NotFoundPage,
});

const PUBLIC_PATHS = [
	"/",
	"/login",
	"/register",
	"/forgot-password",
	"/reset-password",
	"/invite",
	"/docs",
	"/check-email",
	"/verify-email",
	"/onboarding",
];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
}

function Background() {
	return (
		<div className="glow-bg">
			<div className="orb orb-1" />
			<div className="orb orb-2" />
			<div className="orb orb-3" />
		</div>
	);
}

function AuthenticatedLayout() {
	const { data: session } = useSession();
	const { data: organizations, isPending: orgsLoading } =
		useListOrganizations();
	const { data: activeOrg, isPending: activeOrgLoading } =
		useActiveOrganization();
	const user = session?.user;
	const orgList = organizations ?? [];

	// Set active org if user has orgs but none is active
	useEffect(() => {
		if (!orgsLoading && !activeOrgLoading && orgList.length > 0 && !activeOrg) {
			organization.setActive({ organizationId: orgList[0].id });
		}
	}, [orgsLoading, activeOrgLoading, orgList, activeOrg]);

	if (orgsLoading || activeOrgLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	// Redirect to check-email if email not verified
	if (user && !user.emailVerified) {
		return <Navigate to="/check-email" />;
	}

	// Redirect to onboarding if no organization
	if (user?.emailVerified && orgList.length === 0) {
		return <Navigate to="/onboarding" />;
	}

	// Wait for active org to be set
	if (orgList.length > 0 && !activeOrg) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	return (
		<>
			<Background />
			<div className="flex h-screen overflow-hidden">
				<Sidebar />
				<Outlet />
			</div>
		</>
	);
}

function RootLayout() {
	const location = useLocation();
	const { data: session, isPending: authLoading } = useSession();
	const isPublic = isPublicPath(location.pathname);

	// Show loader while checking auth
	if (authLoading && !isPublic) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	// Public routes - no org fetching
	if (isPublic) {
		return (
			<>
				<Background />
				<Outlet />
			</>
		);
	}

	// Not authenticated - redirect to login
	if (!session) {
		return <Navigate to="/login" />;
	}

	// Authenticated - render with org data
	return <AuthenticatedLayout />;
}
