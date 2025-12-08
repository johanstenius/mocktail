"use client";

import { MethodBadge } from "@/components/method-badge";
import { PageHeader } from "@/components/page-header";
import {
	ProjectStatBarSkeleton,
	Skeleton,
	StatCardSkeleton,
	TableRowSkeleton,
} from "@/components/skeleton";
import { getProjects, getRequestLogs } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { HttpMethod, RequestLog } from "@/types";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";

function StatCard({
	label,
	value,
	subtext,
	trend,
	color = "white",
}: {
	label: string;
	value: string | number;
	subtext?: string;
	trend?: string;
	color?: "white" | "success" | "warning" | "violet" | "blue";
}) {
	const colorMap = {
		white: "text-white",
		success: "text-[var(--status-success)]",
		warning: "text-amber-400",
		violet: "text-[var(--glow-violet)]",
		blue: "text-[var(--glow-blue)]",
	};

	return (
		<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 hover:border-[var(--border-highlight)] transition-all">
			<div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
				{label}
			</div>
			<div className={`text-3xl font-bold font-['Outfit'] ${colorMap[color]}`}>
				{value}
			</div>
			{subtext && (
				<div className="text-xs text-[var(--text-muted)] mt-2">{subtext}</div>
			)}
			{trend && (
				<div className="text-xs text-[var(--status-success)] mt-2 flex items-center gap-1">
					<TrendingUp className="h-3 w-3" />
					{trend}
				</div>
			)}
		</div>
	);
}

function ProjectStatBar({
	name,
	slug,
	requestCount,
	maxCount,
	color,
	projectId,
}: {
	name: string;
	slug: string;
	requestCount: number;
	maxCount: number;
	color: string;
	projectId: string;
}) {
	const percentage = maxCount > 0 ? (requestCount / maxCount) * 100 : 0;

	return (
		<Link
			href={`/project/${projectId}`}
			className="block mb-4 last:mb-0 hover:opacity-80 transition-opacity"
		>
			<div className="flex justify-between mb-1">
				<div>
					<span className="font-semibold">{name}</span>
					<span className="text-xs text-[var(--text-muted)] ml-2 font-['JetBrains_Mono']">
						/{slug}
					</span>
				</div>
				<span className="font-bold tabular-nums font-['JetBrains_Mono']">
					{requestCount.toLocaleString()}
				</span>
			</div>
			<div className="h-2 bg-white/10 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${percentage}%`, background: color }}
				/>
			</div>
		</Link>
	);
}

export default function AnalyticsPage() {
	const { data: session, isPending: authLoading } = useSession();

	const isAuthenticated = !!session;
	const user = session?.user;
	const isVerified = Boolean(user?.emailVerified);

	const { data: projects = [], isLoading: projectsLoading } = useQuery({
		queryKey: ["projects"],
		queryFn: getProjects,
		enabled: isAuthenticated && isVerified,
	});

	const logQueries = useQueries({
		queries: projects.map((project) => ({
			queryKey: ["logs", project.id, { limit: 20 }],
			queryFn: () => getRequestLogs(project.id, { limit: 20 }),
			enabled: isAuthenticated && isVerified && projects.length > 0,
		})),
	});

	const allLogs: Array<
		RequestLog & { projectName: string; projectSlug: string }
	> = [];
	for (const [index, project] of projects.entries()) {
		const query = logQueries[index];
		if (query?.data?.logs) {
			for (const log of query.data.logs) {
				allLogs.push({
					...log,
					projectName: project.name,
					projectSlug: project.slug,
				});
			}
		}
	}

	allLogs.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	const recentLogs = allLogs.slice(0, 10);

	const projectStats = projects.map((project, index) => {
		const query = logQueries[index];
		const logs = query?.data?.logs ?? [];
		return {
			project,
			requestCount: query?.data?.total ?? 0,
			recentLogs: logs,
		};
	});

	const totalRequests = projectStats.reduce(
		(sum, p) => sum + p.requestCount,
		0,
	);
	const totalUnmatched = recentLogs.filter((l) => l.status === 404).length;
	const avgLatency =
		allLogs.length > 0
			? Math.round(
					allLogs.reduce((sum, l) => sum + l.duration, 0) / allLogs.length,
				)
			: null;

	const oneHourAgo = Date.now() - 60 * 60 * 1000;
	const requestsLastHour = allLogs.filter(
		(l) => new Date(l.createdAt).getTime() > oneHourAgo,
	).length;

	const maxProjectRequests = Math.max(
		...projectStats.map((p) => p.requestCount),
		1,
	);

	const colors = [
		"var(--glow-violet)",
		"var(--glow-blue)",
		"var(--glow-pink)",
		"var(--glow-emerald)",
	];

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="Analytics"
				icon={
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						className="h-4 w-4 text-[var(--glow-violet)]"
						aria-hidden="true"
					>
						<line x1="18" y1="20" x2="18" y2="10" />
						<line x1="12" y1="20" x2="12" y2="4" />
						<line x1="6" y1="20" x2="6" y2="14" />
					</svg>
				}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-7xl mx-auto">
					{projectsLoading ? (
						<>
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
								<StatCardSkeleton />
								<StatCardSkeleton />
								<StatCardSkeleton />
								<StatCardSkeleton />
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
								<div>
									<Skeleton className="h-6 w-36 mb-4" />
									<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
										<table className="w-full text-sm">
											<thead className="bg-[rgba(0,0,0,0.3)]">
												<tr className="border-b border-[var(--border-subtle)]">
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Time
													</th>
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Project
													</th>
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Method
													</th>
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Path
													</th>
													<th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Status
													</th>
												</tr>
											</thead>
											<tbody>
												<TableRowSkeleton columns={5} />
												<TableRowSkeleton columns={5} />
												<TableRowSkeleton columns={5} />
												<TableRowSkeleton columns={5} />
												<TableRowSkeleton columns={5} />
											</tbody>
										</table>
									</div>
								</div>

								<div>
									<Skeleton className="h-6 w-36 mb-4" />
									<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
										<ProjectStatBarSkeleton />
										<ProjectStatBarSkeleton />
										<ProjectStatBarSkeleton />
									</div>
								</div>
							</div>
						</>
					) : (
						<>
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
								<StatCard
									label="Total Requests"
									value={totalRequests.toLocaleString()}
									color="white"
								/>
								<StatCard
									label="404 Errors"
									value={totalUnmatched}
									subtext={
										totalRequests > 0
											? `${((totalUnmatched / Math.max(totalRequests, 1)) * 100).toFixed(1)}% error rate`
											: undefined
									}
									color="warning"
								/>
								<StatCard
									label="Requests / Hour"
									value={requestsLastHour}
									subtext="last 60 minutes"
									color="violet"
								/>
								<StatCard
									label="Avg Latency"
									value={avgLatency !== null ? `${avgLatency}ms` : "—"}
									subtext={
										avgLatency !== null
											? "across recent requests"
											: "No data yet"
									}
									color="blue"
								/>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
								<div>
									<h3 className="text-xl font-bold mb-4 font-['Outfit']">
										Live Request Log
									</h3>
									<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
										<table className="w-full text-sm">
											<thead className="bg-[rgba(0,0,0,0.3)]">
												<tr className="border-b border-[var(--border-subtle)]">
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Time
													</th>
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Project
													</th>
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Method
													</th>
													<th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Path
													</th>
													<th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Status
													</th>
													<th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
														Duration
													</th>
												</tr>
											</thead>
											<tbody>
												{recentLogs.length === 0 ? (
													<tr>
														<td
															colSpan={6}
															className="px-4 py-12 text-center text-[var(--text-muted)]"
														>
															No requests yet. Make some requests to your mock
															endpoints.
														</td>
													</tr>
												) : (
													recentLogs.map((log) => (
														<tr
															key={log.id}
															className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] ${log.status >= 400 ? "bg-amber-500/5" : ""}`}
														>
															<td className="px-4 py-3 font-['JetBrains_Mono'] text-[var(--text-muted)] text-xs">
																{new Date(log.createdAt).toLocaleTimeString()}
															</td>
															<td className="px-4 py-3">
																<span className="text-xs px-2 py-0.5 bg-[var(--bg-surface-hover)] rounded-lg font-medium">
																	{log.projectName}
																</span>
															</td>
															<td className="px-4 py-3">
																<MethodBadge
																	method={log.method as HttpMethod}
																/>
															</td>
															<td className="px-4 py-3 font-['JetBrains_Mono'] text-sm truncate max-w-[200px]">
																{log.path}
															</td>
															<td className="px-4 py-3 text-right">
																<span
																	className={
																		log.status >= 400
																			? "text-amber-400"
																			: "text-[var(--status-success)]"
																	}
																>
																	{log.status}
																</span>
															</td>
															<td className="px-4 py-3 text-right font-['JetBrains_Mono'] text-xs text-[var(--text-muted)]">
																{log.duration}ms
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>
								</div>

								<div>
									<h3 className="text-xl font-bold mb-4 font-['Outfit']">
										Traffic by Project
									</h3>
									<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
										{projectStats.length === 0 ? (
											<div className="text-center text-[var(--text-muted)] py-4">
												No traffic data
											</div>
										) : (
											projectStats
												.sort((a, b) => b.requestCount - a.requestCount)
												.map((stat, index) => (
													<ProjectStatBar
														key={stat.project.id}
														projectId={stat.project.id}
														name={stat.project.name}
														slug={stat.project.slug}
														requestCount={stat.requestCount}
														maxCount={maxProjectRequests}
														color={colors[index % colors.length]}
													/>
												))
										)}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</main>
	);
}
