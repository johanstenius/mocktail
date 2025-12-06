import { signOut, useActiveOrganization, useSession } from "@/lib/auth-client";
import { BILLING_ENABLED } from "@/lib/config";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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

function getInitials(email: string): string {
	const name = email.split("@")[0];
	const parts = name.split(/[._-]/);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

function UserMenu() {
	const { data: session } = useSession();
	const { data: activeOrg } = useActiveOrganization();
	const [org, setOrg] = useState<{ name: string } | null>(null);

	useEffect(() => {
		if (activeOrg) {
			setOrg({ name: activeOrg.name });
		}
	}, [activeOrg]);

	if (!session?.user) return null;

	const initials = getInitials(session.user.email);

	return (
		<div className="mt-auto pt-6 border-t border-[var(--border-subtle)] px-2">
			<DropdownMenu>
				<DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--bg-surface-hover)] focus:outline-none">
					<div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--glow-pink)] to-[var(--glow-violet)] flex items-center justify-center text-xs font-bold text-white shadow-lg">
						{initials}
					</div>
					<div className="flex-1 overflow-hidden">
						<div className="text-sm font-medium text-[var(--text-primary)] font-['Inter'] truncate">
							{session.user.email}
						</div>
						{org && (
							<div className="text-xs text-[var(--text-muted)] font-['Inter'] truncate">
								{org.name}
							</div>
						)}
					</div>
					<svg
						className="w-4 h-4 text-[var(--text-muted)]"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						aria-hidden="true"
					>
						<path d="M6 9l6 6 6-6" />
					</svg>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="top" align="start" className="w-56">
					<div className="px-2 py-1.5">
						<p className="text-sm font-medium text-[var(--text-primary)]">
							{session.user.email}
						</p>
						{org && (
							<p className="text-xs text-[var(--text-muted)]">{org.name}</p>
						)}
					</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => signOut()}
						className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
					>
						<svg
							className="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
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
				{BILLING_ENABLED && (
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
				)}
				<NavItem
					href="/audit-logs"
					icon={
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
							<polyline points="10 9 9 9 8 9" />
						</svg>
					}
					label="Audit Logs"
				/>
			</div>

			<UserMenu />
		</aside>
	);
}
