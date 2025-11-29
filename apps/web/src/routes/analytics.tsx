import { MethodBadge } from "@/components/method-badge";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getProjects, getRequestLogs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { HttpMethod, RequestLog } from "@/types";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, Loader2, LogOut, TrendingUp } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/analytics")({
	component: AnalyticsPage,
});

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
	color?: "white" | "success" | "warning" | "accent-1" | "accent-2";
}) {
	const colorMap = {
		white: "text-white",
		success: "text-[var(--color-success)]",
		warning: "text-[var(--color-warning)]",
		"accent-1": "text-[var(--color-accent-1)]",
		"accent-2": "text-[var(--color-accent-2)]",
	};

	return (
		<div className="glass rounded-xl p-6 bg-white/[0.02]">
			<div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
				{label}
			</div>
			<div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
			{subtext && (
				<div className="text-xs text-[var(--color-text-subtle)] mt-2">
					{subtext}
				</div>
			)}
			{trend && (
				<div className="text-xs text-[var(--color-success)] mt-2 flex items-center gap-1">
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
			to="/projects/$id"
			params={{ id: projectId }}
			className="block mb-4 last:mb-0 hover:opacity-80 transition-opacity"
		>
			<div className="flex justify-between mb-1">
				<div>
					<span className="font-semibold">{name}</span>
					<span className="text-xs text-[var(--color-text-muted)] ml-2 font-mono">
						/{slug}
					</span>
				</div>
				<span className="font-bold tabular-nums">
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

function AnalyticsPage() {
	const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
	const navigate = useNavigate();
	const [timeRange, setTimeRange] = useState("24h");

	const { data: projects = [], isLoading: projectsLoading } = useQuery({
		queryKey: ["projects"],
		queryFn: getProjects,
		enabled: isAuthenticated,
	});

	const logQueries = useQueries({
		queries: projects.map((project) => ({
			queryKey: ["logs", project.id, { limit: 20 }],
			queryFn: () => getRequestLogs(project.id, { limit: 20 }),
			enabled: isAuthenticated && projects.length > 0,
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
	const maxProjectRequests = Math.max(
		...projectStats.map((p) => p.requestCount),
		1,
	);

	const colors = [
		"var(--color-accent-1)",
		"var(--color-accent-2)",
		"var(--color-accent-3)",
	];

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-white/50" />
			</div>
		);
	}

	if (!isAuthenticated) {
		navigate({ to: "/login" });
		return null;
	}

	async function handleLogout() {
		await logout();
		navigate({ to: "/" });
	}

	return (
		<div className="min-h-screen">
			<Navbar
				actions={
					<>
						<span className="text-sm text-white/60 mr-2 hidden sm:inline">
							{user?.email}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleLogout}
							title="Sign out"
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</>
				}
			/>

			<main className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:px-12">
				<div className="flex justify-between items-center mb-8">
					<div className="flex items-center gap-3">
						<BarChart3 className="h-6 w-6 text-[var(--color-accent-2)]" />
						<h1 className="text-2xl font-bold">Analytics</h1>
					</div>
					<div className="flex items-center gap-4">
						<Select
							value={timeRange}
							onChange={(e) => setTimeRange(e.target.value)}
							className="w-40"
						>
							<option value="1h">Last Hour</option>
							<option value="24h">Last 24 Hours</option>
							<option value="7d">Last 7 Days</option>
							<option value="30d">Last 30 Days</option>
						</Select>
					</div>
				</div>

				{projectsLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-white/50" />
					</div>
				) : projects.length === 0 ? (
					<div className="text-center py-20">
						<div className="text-[var(--color-text-muted)] mb-4">
							No projects yet
						</div>
						<Link to="/dashboard">
							<Button className="bg-white text-black hover:bg-gray-200 rounded-full">
								Create a Project
							</Button>
						</Link>
					</div>
				) : (
					<>
						{/* Stats Grid */}
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
								label="Active Projects"
								value={projects.length}
								color="accent-2"
							/>
							<StatCard
								label="Avg Latency"
								value="—"
								subtext="Coming soon"
								color="accent-1"
							/>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
							{/* Live Log */}
							<div>
								<h3 className="text-lg font-bold mb-4">Live Request Log</h3>
								<div className="glass rounded-xl overflow-hidden">
									<table className="w-full text-sm">
										<thead className="bg-white/[0.02]">
											<tr className="border-b border-white/10">
												<th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
													Time
												</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
													Project
												</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
													Method
												</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
													Path
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
													Status
												</th>
											</tr>
										</thead>
										<tbody>
											{recentLogs.length === 0 ? (
												<tr>
													<td
														colSpan={5}
														className="px-4 py-12 text-center text-[var(--color-text-muted)]"
													>
														No requests yet. Make some requests to your mock
														endpoints.
													</td>
												</tr>
											) : (
												recentLogs.map((log) => (
													<tr
														key={log.id}
														className={`border-b border-white/5 hover:bg-white/[0.02] ${log.status >= 400 ? "bg-[var(--color-warning)]/5" : ""}`}
													>
														<td className="px-4 py-3 font-mono text-[var(--color-text-muted)] text-xs">
															{new Date(log.createdAt).toLocaleTimeString()}
														</td>
														<td className="px-4 py-3">
															<span className="text-xs px-2 py-0.5 bg-white/10 rounded font-medium">
																{log.projectName}
															</span>
														</td>
														<td className="px-4 py-3">
															<MethodBadge method={log.method as HttpMethod} />
														</td>
														<td className="px-4 py-3 font-mono text-sm truncate max-w-[200px]">
															{log.path}
														</td>
														<td className="px-4 py-3 text-right">
															<span
																className={
																	log.status >= 400
																		? "text-[var(--color-warning)]"
																		: "text-[var(--color-success)]"
																}
															>
																{log.status}
															</span>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>

							{/* Project Stats */}
							<div>
								<h3 className="text-lg font-bold mb-4">Traffic by Project</h3>
								<div className="glass rounded-xl p-6">
									{projectStats.length === 0 ? (
										<div className="text-center text-[var(--color-text-muted)] py-4">
											No projects yet
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
			</main>
		</div>
	);
}
