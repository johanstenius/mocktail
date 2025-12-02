import { NotFoundPage } from "@/components/not-found-page";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth";
import {
	Outlet,
	createRootRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
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

function RootLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const { isAuthenticated, emailVerifiedAt, isLoading } = useAuth();

	const isPublic = isPublicPath(location.pathname);

	// Redirect to check-email if authenticated but email not verified
	useEffect(() => {
		if (!isLoading && isAuthenticated && !emailVerifiedAt && !isPublic) {
			navigate({ to: "/check-email" });
		}
	}, [isLoading, isAuthenticated, emailVerifiedAt, isPublic, navigate]);

	const showSidebar = !isPublic;

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
