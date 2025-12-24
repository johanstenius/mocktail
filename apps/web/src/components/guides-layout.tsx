"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
		title: "Integrations",
		items: [
			{ href: "/guides/integrations/node", label: "Node.js" },
			{ href: "/guides/integrations/python", label: "Python" },
			{ href: "/guides/integrations/react", label: "React" },
			{ href: "/guides/integrations/go", label: "Go" },
			{ href: "/guides/integrations/ruby", label: "Ruby" },
		],
	},
	{
		title: "Use Cases",
		items: [
			{
				href: "/guides/use-cases/demo-environments",
				label: "Demo Environments",
			},
			{
				href: "/guides/use-cases/ci-cd-integration",
				label: "CI/CD Integration",
			},
			{
				href: "/guides/use-cases/offline-development",
				label: "Offline Development",
			},
			{
				href: "/guides/use-cases/frontend-prototyping",
				label: "Frontend Prototyping",
			},
			{ href: "/guides/use-cases/load-testing", label: "Load Testing" },
		],
	},
	{
		title: "HTTP Status Codes",
		items: [
			{ href: "/guides/status-codes/200", label: "200 OK" },
			{ href: "/guides/status-codes/201", label: "201 Created" },
			{ href: "/guides/status-codes/400", label: "400 Bad Request" },
			{ href: "/guides/status-codes/401", label: "401 Unauthorized" },
			{ href: "/guides/status-codes/403", label: "403 Forbidden" },
			{ href: "/guides/status-codes/404", label: "404 Not Found" },
			{ href: "/guides/status-codes/429", label: "429 Too Many Requests" },
			{ href: "/guides/status-codes/500", label: "500 Internal Error" },
			{ href: "/guides/status-codes/502", label: "502 Bad Gateway" },
			{ href: "/guides/status-codes/503", label: "503 Unavailable" },
		],
	},
	{
		title: "HTTP Methods",
		items: [
			{ href: "/guides/methods/get", label: "GET" },
			{ href: "/guides/methods/post", label: "POST" },
			{ href: "/guides/methods/put", label: "PUT" },
			{ href: "/guides/methods/patch", label: "PATCH" },
			{ href: "/guides/methods/delete", label: "DELETE" },
			{ href: "/guides/methods/head", label: "HEAD" },
			{ href: "/guides/methods/options", label: "OPTIONS" },
		],
	},
];

function NavLink({
	href,
	children,
	onClick,
}: { href: string; children: string; onClick?: () => void }) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			onClick={onClick}
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

function useGuidesNavigation() {
	const pathname = usePathname();
	const flatNav = navigation.flatMap((group) => group.items);
	const currentIndex = flatNav.findIndex((item) => item.href === pathname);

	const prev = currentIndex > 0 ? flatNav[currentIndex - 1] : null;
	const next =
		currentIndex < flatNav.length - 1 ? flatNav[currentIndex + 1] : null;

	return { prev, next };
}

export function GuidesLayout({ children }: { children: React.ReactNode }) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { prev, next } = useGuidesNavigation();

	return (
		<div className="min-h-screen">
			<header className="fixed top-0 left-0 right-0 z-50 py-4 bg-[rgba(5,5,5,0.8)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
				<div className="container max-w-6xl mx-auto px-6 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glow-violet)] rounded-lg p-1"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
						</button>
						<Link href="/" className="flex items-center gap-2">
							<Logo />
						</Link>
					</div>
					<nav className="flex items-center gap-6">
						<Link
							href="/docs"
							className="hidden sm:block text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Docs
						</Link>
						<Link
							href="/login"
							className="h-9 px-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-highlight)] transition-all flex items-center"
						>
							Sign In
						</Link>
					</nav>
				</div>
			</header>

			{/* Mobile Navigation Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-40 bg-[var(--bg-void)] pt-24 px-6 lg:hidden overflow-y-auto">
					<nav className="space-y-8 pb-12">
						{navigation.map((group) => (
							<div key={group.title}>
								<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3 font-semibold">
									{group.title}
								</div>
								<div className="space-y-1">
									{group.items.map((item) => (
										<NavLink
											key={item.href}
											href={item.href}
											onClick={() => setIsMobileMenuOpen(false)}
										>
											{item.label}
										</NavLink>
									))}
								</div>
							</div>
						))}
					</nav>
				</div>
			)}

			<div className="container max-w-6xl mx-auto px-6 pt-24">
				<div className="flex gap-12">
					<aside className="hidden lg:block w-56 flex-shrink-0">
						<nav className="sticky top-24 space-y-6">
							<div className="mb-6">
								<Link
									href="/docs"
									className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
								>
									<ChevronLeft size={12} />
									Back to Docs
								</Link>
							</div>
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

					<main className="flex-1 min-w-0 pb-24">
						<div className="max-w-3xl">
							{children}

							<div className="mt-16 pt-8 border-t border-[var(--border-subtle)] flex justify-between gap-4">
								{prev ? (
									<Link
										href={prev.href}
										className="group flex flex-col gap-1 p-4 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface)] transition-all text-left"
									>
										<span className="text-xs text-[var(--text-muted)] flex items-center gap-1 group-hover:text-[var(--accent-primary)] transition-colors">
											<ChevronLeft size={12} /> Previous
										</span>
										<span className="font-medium text-[var(--text-primary)]">
											{prev.label}
										</span>
									</Link>
								) : (
									<div />
								)}
								{next && (
									<Link
										href={next.href}
										className="group flex flex-col gap-1 p-4 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface)] transition-all text-right items-end"
									>
										<span className="text-xs text-[var(--text-muted)] flex items-center gap-1 group-hover:text-[var(--accent-primary)] transition-colors">
											Next <ChevronRight size={12} />
										</span>
										<span className="font-medium text-[var(--text-primary)]">
											{next.label}
										</span>
									</Link>
								)}
							</div>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}

export function GuidesHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="mb-12">
			<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
				{title}
			</h1>
			<p className="text-lg text-[var(--text-secondary)]">{description}</p>
		</div>
	);
}

export function GuidesSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-12">
			<h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
				{title}
			</h2>
			<div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
				{children}
			</div>
		</section>
	);
}

export function GuidesFooter() {
	return (
		<div className="border-t border-[var(--border-subtle)] pt-8 mt-16">
			<p className="text-[var(--text-muted)] text-sm">
				Ready to get started?{" "}
				<Link
					href="/docs/quickstart"
					className="text-[var(--glow-violet)] hover:underline"
				>
					Read the quickstart guide
				</Link>
			</p>
		</div>
	);
}

export { CodeBlock } from "@/components/docs-layout";
