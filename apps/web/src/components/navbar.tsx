"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

type NavbarProps = {
	actions?: React.ReactNode;
	showNav?: boolean;
};

export function Navbar({ actions, showNav = true }: NavbarProps) {
	const pathname = usePathname();

	function isActive(path: string) {
		return pathname === path || pathname.startsWith(`${path}/`);
	}

	return (
		<nav className="relative z-50 px-6 py-4 md:px-12">
			<div className="glass rounded-full px-6 py-3 flex items-center justify-between">
				<div className="flex items-center gap-8">
					<Logo />
					{showNav && (
						<div className="hidden md:flex items-center gap-6">
							<Link
								href="/projects"
								className={`text-sm font-medium transition-colors ${
									isActive("/projects")
										? "text-[var(--text-primary)]"
										: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
								}`}
							>
								Projects
							</Link>
							<Link
								href="/analytics"
								className={`text-sm font-medium transition-colors ${
									isActive("/analytics")
										? "text-[var(--text-primary)]"
										: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
