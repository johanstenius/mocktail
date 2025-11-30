import { Sidebar } from "@/components/sidebar";
import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const location = useLocation();

	// Show sidebar for app pages (not landing, auth pages)
	const publicPaths = [
		"/",
		"/login",
		"/register",
		"/forgot-password",
		"/reset-password",
		"/invite",
		"/docs",
	];
	const showSidebar = !publicPaths.some(
		(path) =>
			location.pathname === path || location.pathname.startsWith(`${path}?`),
	);

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
