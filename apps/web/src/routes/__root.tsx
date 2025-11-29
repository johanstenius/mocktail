import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<div className="aurora-container">
				<div className="aurora-blob blob-1" />
				<div className="aurora-blob blob-2" />
				<div className="aurora-blob blob-3" />
			</div>
			<Outlet />
		</>
	);
}
