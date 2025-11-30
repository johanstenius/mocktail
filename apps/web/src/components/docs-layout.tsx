import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";

type NavItem = {
	href: string;
	label: string;
};

type NavGroup = {
	title: string;
	items: NavItem[];
};

const navigation: NavGroup[] = [
	{
		title: "Getting Started",
		items: [
			{ href: "/docs", label: "Introduction" },
			{ href: "/docs/quickstart", label: "Quick Start" },
		],
	},
	{
		title: "Core Concepts",
		items: [
			{ href: "/docs/authentication", label: "Authentication" },
			{ href: "/docs/endpoints", label: "Endpoints" },
			{ href: "/docs/templates", label: "Response Templates" },
		],
	},
	{
		title: "Features",
		items: [
			{ href: "/docs/chaos-engineering", label: "Chaos Engineering" },
			{ href: "/docs/openapi-import", label: "OpenAPI Import" },
			{ href: "/docs/request-logs", label: "Request Logs" },
		],
	},
	{
		title: "Reference",
		items: [
			{ href: "/docs/rate-limits", label: "Rate Limits" },
			{ href: "/docs/errors", label: "Error Responses" },
		],
	},
];

function NavLink({ href, children }: { href: string; children: string }) {
	const location = useLocation();
	const isActive = location.pathname === href;

	return (
		<Link
			to={href}
			className={cn(
				"block py-1.5 text-sm transition-colors",
				isActive
					? "text-[var(--accent-primary)] font-medium"
					: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
			)}
		>
			{children}
		</Link>
	);
}

export function DocsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<header className="fixed top-0 left-0 right-0 z-50 py-4 bg-[rgba(5,5,5,0.8)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
				<div className="container max-w-6xl mx-auto px-6 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<Logo />
					</Link>
					<nav className="flex items-center gap-6">
						<Link
							to="/"
							className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Home
						</Link>
						<Link
							to="/login"
							className="h-9 px-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-highlight)] transition-all flex items-center"
						>
							Sign In
						</Link>
					</nav>
				</div>
			</header>

			<div className="container max-w-6xl mx-auto px-6 pt-24">
				<div className="flex gap-12">
					<aside className="hidden lg:block w-56 flex-shrink-0">
						<nav className="sticky top-24 space-y-6">
							{navigation.map((group) => (
								<div key={group.title}>
									<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
										{group.title}
									</div>
									{group.items.map((item) => (
										<NavLink key={item.href} href={item.href}>
											{item.label}
										</NavLink>
									))}
								</div>
							))}
						</nav>
					</aside>

					<main className="flex-1 min-w-0 pb-24">{children}</main>
				</div>
			</div>
		</div>
	);
}

export function CodeBlock({ children }: { children: string }) {
	return (
		<pre className="bg-[rgba(0,0,0,0.4)] border border-[var(--border-subtle)] rounded-xl p-4 overflow-x-auto text-sm font-['JetBrains_Mono'] text-slate-200">
			<code>{children}</code>
		</pre>
	);
}

export function DocsHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="mb-12">
			<h1 className="text-4xl font-bold mb-4 font-['Outfit'] bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
				{title}
			</h1>
			<p className="text-lg text-[var(--text-secondary)]">{description}</p>
		</div>
	);
}

export function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-12">
			<h2 className="text-xl font-bold mb-4 font-['Outfit'] text-[var(--text-primary)]">
				{title}
			</h2>
			<div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
				{children}
			</div>
		</section>
	);
}

export function DocsFooter() {
	return (
		<div className="border-t border-[var(--border-subtle)] pt-8 mt-16">
			<p className="text-[var(--text-muted)] text-sm">
				Need help?{" "}
				<a
					href="mailto:support@mocktail.dev"
					className="text-[var(--glow-violet)] hover:underline"
				>
					Contact support
				</a>
			</p>
		</div>
	);
}
