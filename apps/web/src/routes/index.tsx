import { Logo } from "@/components/logo";
import { Link, createFileRoute } from "@tanstack/react-router";

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
						<a
							href="#docs"
							className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Docs
						</a>
					</nav>
					<Link
						to="/login"
						className="h-9 px-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium backdrop-blur-md hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-highlight)] transition-all flex items-center"
					>
						Sign In
					</Link>
				</div>
			</header>

			{/* Hero Section */}
			<section className="container max-w-6xl mx-auto px-6 pt-44 pb-24 text-center relative">
				<h1 className="text-7xl font-bold leading-[1.1] mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent font-['Outfit'] tracking-tight">
					Build frontends without
					<br />
					waiting for backend.
				</h1>
				<p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
					The local-first mock API server with built-in auth simulation. Import
					OpenAPI specs, customize responses, and share with your team.
				</p>
				<div className="flex gap-4 justify-center mb-16">
					<Link
						to="/register"
						className="h-12 px-7 rounded-full bg-[var(--accent-primary)] text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:bg-[#7c3aed] hover:-translate-y-0.5 transition-all flex items-center font-['Inter']"
					>
						Start for Free
					</Link>
					<a
						href="#docs"
						className="h-12 px-7 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-semibold backdrop-blur-md hover:bg-[rgba(255,255,255,0.1)] hover:border-[var(--border-highlight)] transition-all flex items-center font-['Inter']"
					>
						Read Documentation
					</a>
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
								{"// 2. Get realistic data with auth simulation"}
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
							title: "Auth Simulation",
							desc: "Test login flows with realistic JWTs and session management built-in.",
							icon: "🔐",
						},
						{
							title: "OpenAPI Import",
							desc: "Generate endpoints instantly from your Swagger/OpenAPI specs.",
							icon: "📄",
						},
						{
							title: "Realistic Data",
							desc: "Simulate latency, errors, and dynamic data with Faker.js templates.",
							icon: "🎯",
						},
						{
							title: "Team Sync",
							desc: "Share mock APIs with your team and keep everyone in sync.",
							icon: "🤝",
						},
					].map((feature) => (
						<div
							key={feature.title}
							className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)] transition-all group"
						>
							<div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
								{feature.icon}
							</div>
							<h3 className="text-lg font-bold mb-2 font-['Outfit'] text-[var(--text-primary)]">
								{feature.title}
							</h3>
							<p className="text-[var(--text-secondary)] text-sm leading-relaxed">
								{feature.desc}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="container max-w-6xl mx-auto px-6 pb-24">
				<h2 className="text-4xl font-bold text-center mb-16 font-['Outfit']">
					Simple, transparent pricing.
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Free Tier */}
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)]">
						<div className="text-xl font-semibold mb-1 font-['Outfit']">
							Developer
						</div>
						<div className="text-4xl font-bold mb-4 font-['Outfit'] flex items-baseline gap-1">
							$0
							<span className="text-base text-[var(--text-muted)] font-normal">
								/mo
							</span>
						</div>
						<p className="text-[var(--text-secondary)] text-sm mb-6 min-h-[48px]">
							Perfect for side projects and indie hackers.
						</p>
						<ul className="space-y-3 mb-8 flex-grow">
							{[
								"3 Projects",
								"30 Endpoints",
								"10,000 Requests/mo",
								"3 Team Members",
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
					</div>

					{/* Pro Tier */}
					<div className="bg-gradient-to-b from-[rgba(139,92,246,0.05)] to-transparent border border-[rgba(139,92,246,0.5)] rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 relative bg-[var(--bg-surface)]">
						<div className="absolute top-3 right-3 text-[10px] font-bold text-[#a78bfa] bg-[rgba(139,92,246,0.1)] px-2 py-1 rounded-full border border-[rgba(139,92,246,0.2)]">
							MOST POPULAR
						</div>
						<div className="text-xl font-semibold mb-1 font-['Outfit']">
							Pro
						</div>
						<div className="text-4xl font-bold mb-4 font-['Outfit'] flex items-baseline gap-1">
							$29
							<span className="text-base text-[var(--text-muted)] font-normal">
								/mo
							</span>
						</div>
						<p className="text-[var(--text-secondary)] text-sm mb-6 min-h-[48px]">
							For growing teams shipping to production.
						</p>
						<ul className="space-y-3 mb-8 flex-grow">
							{[
								"20 Projects",
								"2,000 Endpoints",
								"500,000 Requests/mo",
								"Unlimited Team Members",
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
							className="w-full py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-void)] font-semibold text-center hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
						>
							Get Started
						</Link>
					</div>

					{/* Enterprise Tier */}
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)]">
						<div className="text-xl font-semibold mb-1 font-['Outfit']">
							Enterprise
						</div>
						<div className="text-4xl font-bold mb-4 font-['Outfit']">
							Custom
						</div>
						<p className="text-[var(--text-secondary)] text-sm mb-6 min-h-[48px]">
							Security and control for large organizations.
						</p>
						<ul className="space-y-3 mb-8 flex-grow">
							{[
								"Unlimited Projects",
								"Unlimited Endpoints",
								"Unlimited Requests",
								"SSO / SAML",
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
						<a
							href="#contact"
							className="w-full py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-center hover:border-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all"
						>
							Contact Sales
						</a>
					</div>
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
