import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "./logo";

type NavbarProps = {
	actions?: React.ReactNode;
	showNav?: boolean;
};

export function Navbar({ actions, showNav = true }: NavbarProps) {
	const location = useLocation();

	function isActive(path: string) {
		return (
			location.pathname === path || location.pathname.startsWith(`${path}/`)
		);
	}

	return (
		<nav className="relative z-50 px-6 py-4 md:px-12">
			<div className="glass rounded-full px-6 py-3 flex items-center justify-between">
				<div className="flex items-center gap-8">
					<Logo />
					{showNav && (
						<div className="hidden md:flex items-center gap-6">
							<Link
								to="/projects"
								className={`text-sm font-medium transition-colors ${
									isActive("/projects")
										? "text-white"
										: "text-white/60 hover:text-white"
								}`}
							>
								Projects
							</Link>
							<Link
								to="/analytics"
								className={`text-sm font-medium transition-colors ${
									isActive("/analytics")
										? "text-white"
										: "text-white/60 hover:text-white"
								}`}
							>
								Analytics
							</Link>
						</div>
					)}
				</div>

				{actions && <div className="flex items-center gap-3">{actions}</div>}
			</div>
		</nav>
	);
}
