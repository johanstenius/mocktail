import { NotFoundPage } from "@/components/not-found-page";
import { Sidebar } from "@/components/sidebar";
import { useAuth, useOrganizations } from "@johanstenius/auth-react";
import {
	Navigate,
	Outlet,
	createRootRoute,
	useLocation,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

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

function RootLayout() {
	const location = useLocation();
	const { isAuthenticated, user, isLoading: authLoading } = useAuth();
	const { organizations, isLoading: orgsLoading } = useOrganizations();

	const isPublic = isPublicPath(location.pathname);
	const isLoading = authLoading || (isAuthenticated && orgsLoading);

	// Show loader while checking auth state
	if (isLoading && !isPublic) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	// Redirect to login if not authenticated on protected route
	if (!isPublic && !isAuthenticated) {
		return <Navigate to="/login" />;
	}

	// Redirect to check-email if email not verified
	if (!isPublic && isAuthenticated && user && !user.emailVerified) {
		return <Navigate to="/check-email" />;
	}

	// Redirect to onboarding if no organization
	if (
		!isPublic &&
		isAuthenticated &&
		user?.emailVerified &&
		organizations.length === 0
	) {
		return <Navigate to="/onboarding" />;
	}

	const showSidebar = !isPublic && isAuthenticated && organizations.length > 0;

	return (
		<>
			<div className="glow-bg">
				<div className="orb orb-1" />
				<div className="orb orb-2" />
				<div className="orb orb-3" />
			</div>
			{showSidebar ? (
				<div className="flex h-screen overflow-hidden">
					<Sidebar />
					<Outlet />
				</div>
			) : (
				<Outlet />
			)}
		</>
	);
}
