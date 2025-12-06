import { Logo } from "@/components/logo";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BILLING_ENABLED } from "@/lib/config";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Database, FileJson, Rocket, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="min-h-screen">
			{/* Header */}
			<header
				id="header"
				className="fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300"
			>
				<div className="container max-w-6xl mx-auto px-6 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<Logo />
					</Link>
					<nav className="hidden md:flex items-center gap-8 bg-[var(--bg-surface)] px-6 py-2 rounded-full border border-[var(--border-subtle)] backdrop-blur-md">
						<a
							href="#features"
							className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Features
						</a>
						<a
							href="#pricing"
							className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Pricing
						</a>
						<Link
							to="/docs"
							className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Docs
						</Link>
					</nav>
					<div className="flex items-center gap-4">
						<Link
							to="/login"
							className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
						>
							Sign In
						</Link>
						<Link
							to="/register"
							className="h-9 px-4 rounded-full bg-[var(--glow-violet)] text-white text-sm font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10 hover:bg-[#7c3aed] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all flex items-center"
						>
							Get Started
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="container max-w-6xl mx-auto px-6 pt-44 pb-24 text-center relative">
				<h1 className="text-7xl font-bold leading-[1.1] mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent font-['Outfit'] tracking-tight">
					Instant Mock APIs.
					<br />
					Ready in seconds.
				</h1>
				<p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
					The mock API server for modern teams. Import OpenAPI specs, simulate
					real-world conditions, and ship faster together.
				</p>
				<div className="flex gap-4 justify-center mb-16">
					<Link
						to="/register"
						className="h-12 px-7 rounded-full bg-[var(--accent-primary)] text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:bg-[#7c3aed] hover:-translate-y-0.5 transition-all flex items-center font-['Inter']"
					>
						Start for Free
					</Link>
					<Link
						to="/docs"
						className="h-12 px-7 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-semibold backdrop-blur-md hover:bg-[rgba(255,255,255,0.1)] hover:border-[var(--border-highlight)] transition-all flex items-center font-['Inter']"
					>
						Read Documentation
					</Link>
				</div>

				{/* Code Preview */}
				<div className="max-w-3xl mx-auto bg-[rgba(10,10,10,0.6)] border border-[var(--border-subtle)] rounded-xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-left">
					<div className="px-5 py-3 border-b border-[var(--border-subtle)] flex gap-2">
						<div className="w-2.5 h-2.5 rounded-full bg-[var(--border-highlight)]" />
						<div className="w-2.5 h-2.5 rounded-full bg-[var(--border-highlight)]" />
						<div className="w-2.5 h-2.5 rounded-full bg-[var(--border-highlight)]" />
					</div>
					<div className="p-6 font-['JetBrains_Mono'] text-sm text-slate-200 leading-relaxed">
						<div>
							<span className="text-[#64748b]">
								{"// 1. Define your mock endpoint"}
							</span>
						</div>
						<div>
							<span className="text-[#c084fc]">const</span> response ={" "}
							<span className="text-[#c084fc]">await</span>{" "}
							<span className="text-[#60a5fa]">fetch</span>(
							<span className="text-[#86efac]">
								'https://api.mocktail.dev/mock/shop-v1/products'
							</span>
							);
						</div>
						<br />
						<div>
							<span className="text-[#64748b]">
								{"// 2. Get realistic data instantly"}
							</span>
						</div>
						<div>
							<span className="text-[#c084fc]">const</span> data ={" "}
							<span className="text-[#c084fc]">await</span> response.
							<span className="text-[#60a5fa]">json</span>();
						</div>
						<div>
							<span className="text-[#64748b]">
								{"// { id: 'prod_123', name: 'Premium Plan', price: 2900 }"}
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="container max-w-6xl mx-auto px-6 py-24">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4 font-['Outfit']">
						Built for modern engineering teams.
					</h2>
					<p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
						Everything you need to mock APIs at scale, without the complexity.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[
						{
							title: "OpenAPI Import",
							desc: "Generate endpoints instantly from your Swagger/OpenAPI specs.",
							icon: FileJson,
						},
						{
							title: "Chaos Engineering",
							desc: "Simulate latency, errors, and failures to test your app's resilience.",
							icon: Zap,
						},
						{
							title: "Dynamic Data",
							desc: "Generate realistic fake data with templates. Names, emails, UUIDs, and more.",
							icon: Database,
						},
						{
							title: "Team Collaboration",
							desc: "Share mock APIs with your team. Everyone stays in sync.",
							icon: Users,
						},
					].map((feature) => (
						<Card
							key={feature.title}
							className="hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)] transition-all group"
						>
							<CardHeader>
								<div className="mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
									<feature.icon className="w-10 h-10 text-[var(--accent-primary)] drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
								</div>
								<CardTitle className="text-lg">{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm leading-relaxed">
									{feature.desc}
								</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* How It Works Section */}
			<section className="container max-w-6xl mx-auto px-6 py-24 border-t border-[var(--border-subtle)]">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4 font-['Outfit']">
						From zero to mock API in minutes.
					</h2>
					<p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
						No backend required. No infrastructure to manage.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{[
						{
							step: "1",
							title: "Create a project",
							desc: "Sign up and create a project. Import an OpenAPI spec or start from scratch.",
						},
						{
							step: "2",
							title: "Define your endpoints",
							desc: "Configure methods, paths, and response bodies. Add delays and failure rates for testing.",
						},
						{
							step: "3",
							title: "Start building",
							desc: "Use your API key to call endpoints. Monitor requests in real-time with detailed logs.",
						},
					].map((item) => (
						<Card
							key={item.step}
							className="relative overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-highlight)] transition-all duration-300 hover:-translate-y-1 group"
						>
							<div className="absolute top-0 right-0 p-32 bg-[var(--accent-primary)]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100" />
							<CardHeader>
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-violet-600 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:scale-110 transition-transform duration-300">
									<span className="text-white font-bold font-['Outfit'] text-lg">
										{item.step}
									</span>
								</div>
								<CardTitle className="text-xl mb-2">{item.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-[var(--text-secondary)] leading-relaxed">
									{item.desc}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="container max-w-6xl mx-auto px-6 pb-24">
				<h2 className="text-4xl font-bold text-center mb-16 font-['Outfit']">
					Simple, transparent pricing.
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
					{/* Free Tier */}
					<Card className="rounded-3xl p-2 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)]">
						<CardHeader className="pb-0">
							<CardTitle className="text-xl font-semibold mb-1">Free</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col flex-grow pt-4">
							<div className="text-4xl font-bold mb-4 font-['Outfit'] flex items-baseline gap-1">
								$0
								<span className="text-base text-[var(--text-muted)] font-normal">
									/mo
								</span>
							</div>
							<p className="text-[var(--text-secondary)] text-sm mb-6 min-h-[48px]">
								Try it out, no credit card required.
							</p>
							<ul className="space-y-3 mb-8 flex-grow">
								{[
									"2 Projects",
									"5 Endpoints per Project",
									"1,000 Requests/mo",
									"Solo Use Only",
									"1 Day Log Retention",
								].map((feature) => (
									<li
										key={feature}
										className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
									>
										<span className="text-[var(--accent-primary)] text-lg">
											✓
										</span>{" "}
										{feature}
									</li>
								))}
							</ul>
							<Link
								to="/register"
								className="w-full py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-center hover:border-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all"
							>
								Start Free
							</Link>
						</CardContent>
					</Card>

					{/* Pro Tier */}
					<Card className="rounded-3xl p-2 flex flex-col transition-all duration-300 hover:-translate-y-1 relative bg-gradient-to-b from-[rgba(139,92,246,0.05)] to-transparent border-[rgba(139,92,246,0.5)]">
						<div className="absolute top-5 right-5 text-[10px] font-bold text-[#a78bfa] bg-[rgba(139,92,246,0.1)] px-2 py-1 rounded-full border border-[rgba(139,92,246,0.2)]">
							{BILLING_ENABLED ? "RECOMMENDED" : "COMING SOON"}
						</div>
						<CardHeader className="pb-0">
							<CardTitle className="text-xl font-semibold mb-1">Pro</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col flex-grow pt-4">
							<div className="text-4xl font-bold mb-4 font-['Outfit'] flex items-baseline gap-1">
								$29
								<span className="text-base text-[var(--text-muted)] font-normal">
									/mo
								</span>
							</div>
							<p className="text-[var(--text-secondary)] text-sm mb-6 min-h-[48px]">
								For teams shipping to production.
							</p>
							<ul className="space-y-3 mb-8 flex-grow">
								{[
									"10 Projects",
									"50 Endpoints per Project",
									"100,000 Requests/mo",
									"10 Team Members",
									"30 Day Log Retention",
								].map((feature) => (
									<li
										key={feature}
										className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
									>
										<span className="text-[var(--accent-primary)] text-lg">
											✓
										</span>{" "}
										{feature}
									</li>
								))}
							</ul>
							{BILLING_ENABLED ? (
								<Link
									to="/register"
									className="w-full py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-void)] font-semibold text-center hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
								>
									Get Started
								</Link>
							) : (
								<div className="w-full py-3 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] text-[var(--glow-violet)] font-semibold text-center flex items-center justify-center gap-2 cursor-default">
									<Rocket className="w-4 h-4" />
									Coming Soon
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-[var(--border-subtle)] py-16 text-center text-[var(--text-muted)] text-sm bg-[rgba(5,5,5,0.5)] backdrop-blur-md">
				<div className="container max-w-6xl mx-auto px-6">
					<p>&copy; 2025 Mocktail. Built by developers, for developers.</p>
				</div>
			</footer>
		</div>
	);
}
