import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<div className="font-extrabold text-2xl tracking-tight uppercase text-white">
					Mocktail
				</div>
				<nav className="hidden md:flex gap-8">
					<Link
						to="/"
						className="text-white/60 hover:text-white transition-colors font-medium uppercase text-sm tracking-widest"
					>
						Product
					</Link>
					<Link
						to="/"
						className="text-white/60 hover:text-white transition-colors font-medium uppercase text-sm tracking-widest"
					>
						Docs
					</Link>
					<Link
						to="/"
						className="text-white/60 hover:text-white transition-colors font-medium uppercase text-sm tracking-widest"
					>
						Pricing
					</Link>
					<Link
						to="/login"
						className="text-white/60 hover:text-white transition-colors font-medium uppercase text-sm tracking-widest"
					>
						Login
					</Link>
				</nav>
			</header>

			<main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 pb-20">
				{/* Floating UI Elements */}
				<div className="absolute top-[20%] left-[10%] -rotate-6 bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm text-gray-300 backdrop-blur-sm hidden lg:block animate-float-slow">
					HTTP 200 OK
					<br />
					Latency: 24ms
				</div>
				<div className="absolute bottom-[30%] right-[5%] rotate-6 bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm text-[var(--color-accent-2)] backdrop-blur-sm hidden lg:block animate-float-slower">
					{`{ "status": "authorized" }`}
				</div>

				<h1 className="text-6xl md:text-8xl font-extrabold leading-[0.95] mb-6 tracking-tight">
					Fake It 'Til You <br />
					<span className="text-gradient">Make It.</span>
				</h1>
				<p className="text-xl md:text-2xl text-white/70 max-w-3xl mb-12 font-light leading-relaxed">
					The world's most powerful mock server. Build frontend features today.
					Worry about the backend tomorrow.
				</p>

				<div className="flex flex-col sm:flex-row gap-6">
					<Link
						to="/dashboard"
						className="px-12 py-5 bg-white text-black rounded-full font-extrabold text-lg hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all duration-300"
					>
						Start Mocking
					</Link>
					<Link
						to="/"
						className="px-12 py-5 bg-white/5 text-white border border-white/15 rounded-full font-extrabold text-lg backdrop-blur-md hover:bg-white/10 hover:border-white transition-all duration-300"
					>
						Read the Spec
					</Link>
				</div>
			</main>

			<section className="container mx-auto px-4 py-20 relative z-10">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="glass-card p-10 rounded-3xl group">
						<div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 border border-white/10 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/10 transition-all duration-300">
							⚡️
						</div>
						<h3 className="text-2xl font-bold mb-4">Lightning Fast</h3>
						<p className="text-white/60 leading-relaxed text-lg">
							Spin up a mock server in seconds. No config files, no docker
							containers. Just a URL.
						</p>
					</div>
					<div className="glass-card p-10 rounded-3xl group">
						<div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 border border-white/10 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/10 transition-all duration-300">
							🔐
						</div>
						<h3 className="text-2xl font-bold mb-4">Real Auth</h3>
						<p className="text-white/60 leading-relaxed text-lg">
							Don't just mock data, mock security. Test your JWT flows and API
							keys like it's production.
						</p>
					</div>
					<div className="glass-card p-10 rounded-3xl group">
						<div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 border border-white/10 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/10 transition-all duration-300">
							🎲
						</div>
						<h3 className="text-2xl font-bold mb-4">Chaos Ready</h3>
						<p className="text-white/60 leading-relaxed text-lg">
							Inject random failures and latency. See how your app handles the
							worst case scenarios.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
