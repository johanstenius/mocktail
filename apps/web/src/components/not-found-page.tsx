import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

export function NotFoundPage() {
	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] overflow-hidden">
			{/* Background Effects */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--glow-violet)]/10 rounded-full blur-[120px]" />
				<div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--glow-blue)]/10 rounded-full blur-[120px]" />
			</div>

			<div className="relative z-10 text-center px-4">
				<div className="mb-8 relative">
					<h1 className="text-[150px] font-bold font-['Outfit'] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 select-none">
						404
					</h1>
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
						<h1 className="text-[150px] font-bold font-['Outfit'] leading-none tracking-tighter text-[var(--glow-violet)] blur-2xl opacity-30 select-none">
							404
						</h1>
					</div>
				</div>

				<h2 className="text-2xl md:text-3xl font-bold font-['Outfit'] mb-4">
					Endpoint Not Found
				</h2>
				<p className="text-[var(--text-muted)] font-['Inter'] max-w-md mx-auto mb-8 text-lg">
					It seems this route hasn't been mocked yet. Check your URL or return
					to the dashboard.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button
						variant="outline"
						size="lg"
						onClick={() => window.history.back()}
						className="w-full sm:w-auto border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Go Back
					</Button>
					<Link to="/">
						<Button
							size="lg"
							className="w-full sm:w-auto bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10"
						>
							<Home className="mr-2 h-4 w-4" />
							Return Home
						</Button>
					</Link>
				</div>
			</div>

			{/* Decorative Grid */}
			<div
				className="absolute inset-0 pointer-events-none opacity-20"
				style={{
					backgroundImage:
						"linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
					maskImage:
						"radial-gradient(circle at center, black 40%, transparent 80%)",
				}}
			/>
		</div>
	);
}
