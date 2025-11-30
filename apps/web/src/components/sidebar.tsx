import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "./logo";

type NavItemProps = {
	href: string;
	icon: React.ReactNode;
	label: string;
};

function NavItem({ href, icon, label }: NavItemProps) {
	const location = useLocation();
	const isActive =
		location.pathname === href || location.pathname.startsWith(`${href}/`);

	return (
		<Link
			to={href}
			className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.9rem] font-medium transition-all duration-200 mb-0.5 font-['Inter']
        ${
					isActive
						? "text-white bg-gradient-to-r from-[rgba(139,92,246,0.1)] to-transparent border-l-2 border-[var(--glow-violet)] rounded-l-none"
						: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border-l-2 border-transparent"
				}
      `}
		>
			<span
				className={`w-[18px] h-[18px] ${isActive ? "opacity-100 text-[var(--glow-violet)]" : "opacity-70"}`}
			>
				{icon}
			</span>
			{label}
		</Link>
	);
}

export function Sidebar() {
	return (
		<aside className="w-[var(--sidebar-width)] h-screen border-r border-[var(--border-subtle)] bg-[rgba(5,5,5,0.5)] backdrop-blur-xl flex flex-col p-6 flex-shrink-0">
			<div className="mb-8 px-2">
				<Link to="/" className="flex items-center gap-2">
					<Logo />
				</Link>
			</div>

			<div className="mb-6">
				<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 px-4 font-['Inter'] font-semibold">
					Platform
				</div>
				<NavItem
					href="/dashboard"
					icon={
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<rect x="3" y="3" width="7" height="7" />
							<rect x="14" y="3" width="7" height="7" />
							<rect x="14" y="14" width="7" height="7" />
							<rect x="3" y="14" width="7" height="7" />
						</svg>
					}
					label="Dashboard"
				/>
				<NavItem
					href="/projects"
					icon={
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
						</svg>
					}
					label="Projects"
				/>
				<NavItem
					href="/analytics"
					icon={
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<line x1="18" y1="20" x2="18" y2="10" />
							<line x1="12" y1="20" x2="12" y2="4" />
							<line x1="6" y1="20" x2="6" y2="14" />
						</svg>
					}
					label="Analytics"
				/>
			</div>

			<div className="mb-6">
				<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 px-4 font-['Inter'] font-semibold">
					Organization
				</div>
				<NavItem
					href="/team"
					icon={
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					}
					label="Team"
				/>
				<NavItem
					href="/billing"
					icon={
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
							<line x1="1" y1="10" x2="23" y2="10" />
						</svg>
					}
					label="Billing"
				/>
			</div>

			<div className="mt-auto flex items-center gap-3 pt-6 border-t border-[var(--border-subtle)] px-2">
				<div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--glow-pink)] to-[var(--glow-violet)] flex items-center justify-center text-xs font-bold text-white shadow-lg">
					JS
				</div>
				<div className="flex-1 overflow-hidden">
					<div className="text-sm font-medium text-[var(--text-primary)] font-['Inter']">
						Johan Stenius
					</div>
					<div className="text-xs text-[var(--text-muted)] font-['Inter']">
						Acme Corp
					</div>
				</div>
			</div>
		</aside>
	);
}
