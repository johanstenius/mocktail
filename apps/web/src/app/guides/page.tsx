import { GuidesHeader, GuidesLayout } from "@/components/guides-layout";
import { Code2, FileCode, Hash, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Guides & Reference | Mockspec",
	description:
		"Learn how to integrate Mockspec with your stack. Guides for Node.js, Python, React, Go, Ruby, plus HTTP status codes and methods reference.",
	openGraph: {
		title: "Guides & Reference | Mockspec",
		description:
			"Learn how to integrate Mockspec with your stack. Guides for Node.js, Python, React, Go, Ruby, plus HTTP status codes and methods reference.",
	},
};

const categories = [
	{
		title: "Integrations",
		description: "Connect Mockspec with your favorite languages and frameworks",
		href: "/guides/integrations/node",
		icon: Code2,
		items: ["Node.js", "Python", "React", "Go", "Ruby"],
		count: 5,
	},
	{
		title: "Use Cases",
		description: "Real-world scenarios and implementation patterns",
		href: "/guides/use-cases/demo-environments",
		icon: Layers,
		items: [
			"Demo Environments",
			"CI/CD",
			"Offline Dev",
			"Prototyping",
			"Load Testing",
		],
		count: 5,
	},
	{
		title: "HTTP Status Codes",
		description: "Mock any HTTP status code for testing error handling",
		href: "/guides/status-codes/200",
		icon: Hash,
		items: [
			"200 OK",
			"201 Created",
			"400 Bad Request",
			"401 Unauthorized",
			"500 Error",
		],
		count: 10,
	},
	{
		title: "HTTP Methods",
		description: "Reference for all supported HTTP methods",
		href: "/guides/methods/get",
		icon: FileCode,
		items: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
		count: 7,
	},
];

export default function GuidesPage() {
	return (
		<GuidesLayout>
			<GuidesHeader
				title="Guides & Reference"
				description="Everything you need to integrate Mockspec with your stack and build realistic mock APIs."
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{categories.map((category) => {
					const Icon = category.icon;
					return (
						<Link
							key={category.title}
							href={category.href}
							className="group p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)] transition-all"
						>
							<div className="flex items-start gap-4">
								<div className="p-2.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-subtle)] group-hover:border-[var(--glow-violet)]/30 transition-colors">
									<Icon
										size={20}
										className="text-[var(--text-muted)] group-hover:text-[var(--glow-violet)] transition-colors"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2 mb-1">
										<h2 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--glow-violet)] transition-colors">
											{category.title}
										</h2>
										<span className="text-xs text-[var(--text-muted)] bg-[var(--bg-void)] px-2 py-0.5 rounded-full">
											{category.count}
										</span>
									</div>
									<p className="text-sm text-[var(--text-secondary)] mb-3">
										{category.description}
									</p>
									<div className="flex flex-wrap gap-1.5">
										{category.items.slice(0, 4).map((item) => (
											<span
												key={item}
												className="text-xs text-[var(--text-muted)] bg-[var(--bg-void)] px-2 py-0.5 rounded"
											>
												{item}
											</span>
										))}
										{category.items.length > 4 && (
											<span className="text-xs text-[var(--text-muted)]">
												+{category.items.length - 4} more
											</span>
										)}
									</div>
								</div>
							</div>
						</Link>
					);
				})}
			</div>

			<div className="mt-12 p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
				<h3 className="font-semibold text-[var(--text-primary)] mb-2">
					New to Mockspec?
				</h3>
				<p className="text-sm text-[var(--text-secondary)] mb-4">
					Start with the documentation to learn the basics of creating projects,
					defining endpoints, and making your first mock API request.
				</p>
				<Link
					href="/docs"
					className="inline-flex items-center text-sm font-medium text-[var(--glow-violet)] hover:underline"
				>
					Read the docs →
				</Link>
			</div>
		</GuidesLayout>
	);
}
