import { EmptyState } from "@/components/empty-state";
import { EndpointForm } from "@/components/endpoint-form";
import { ImportModal } from "@/components/import-modal";
import { MethodBadge } from "@/components/method-badge";
import { Navbar } from "@/components/navbar";
import { RequestLogTable } from "@/components/request-log-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
	deleteEndpoint,
	getEndpoints,
	getProject,
	getProjectStatistics,
	getRequestLogs,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
	Endpoint,
	EndpointStat,
	HttpMethod,
	UnmatchedRequest,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	Copy,
	Layers,
	Loader2,
	Plus,
	Route as RouteIcon,
	ScrollText,
	Settings,
	Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/projects/$id")({
	component: ProjectDetailPage,
});

type TabId = "endpoints" | "logs" | "analytics" | "settings";

function formatRelativeTime(dateStr: string | null): string {
	if (!dateStr) return "never";
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return "just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHour < 24) return `${diffHour}h ago`;
	return `${diffDay}d ago`;
}

function EndpointRow({
	endpoint,
	projectId,
	stat,
	onEdit,
}: {
	endpoint: Endpoint;
	projectId: string;
	stat?: EndpointStat;
	onEdit: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deleteEndpoint(projectId, endpoint.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
		},
	});

	return (
		// biome-ignore lint/a11y/useSemanticElements: Using div for complex layout with nested interactive elements
		<div
			role="button"
			tabIndex={0}
			className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer"
			onClick={onEdit}
			onKeyDown={(e) => e.key === "Enter" && onEdit()}
		>
			<MethodBadge method={endpoint.method} />
			<span className="flex-1 font-mono text-sm">{endpoint.path}</span>
			{stat && stat.requestCount > 0 && (
				<span className="text-xs text-[var(--color-text-subtle)] tabular-nums">
					{stat.requestCount} hits
				</span>
			)}
			{stat?.lastRequestAt && (
				<span className="text-xs text-[var(--color-text-subtle)]">
					{formatRelativeTime(stat.lastRequestAt)}
				</span>
			)}
			<StatusBadge status={endpoint.status} />
			{endpoint.delay > 0 && (
				<span className="text-xs text-[var(--color-text-subtle)]">
					+{endpoint.delay}ms
				</span>
			)}
			{endpoint.failRate > 0 && (
				<span className="text-xs text-[var(--color-warning)]">
					{endpoint.failRate}% fail
				</span>
			)}
			<div
				className="flex items-center gap-1"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{showConfirm ? (
					<>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowConfirm(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => deleteMutation.mutate()}
						>
							Delete
						</Button>
					</>
				) : (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 opacity-0 group-hover:opacity-100"
						onClick={() => setShowConfirm(true)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	subtext,
	color = "white",
}: {
	label: string;
	value: string | number;
	subtext?: string;
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
		<div className="glass rounded-xl p-4 bg-white/[0.02]">
			<div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
				{label}
			</div>
			<div className={`text-2xl font-bold ${colorMap[color]}`}>{value}</div>
			{subtext && (
				<div className="text-xs text-[var(--color-text-subtle)] mt-1">
					{subtext}
				</div>
			)}
		</div>
	);
}

function TopEndpointBar({
	path,
	count,
	maxCount,
	color,
	lastActive,
}: {
	path: string;
	count: number;
	maxCount: number;
	color: string;
	lastActive: string | null;
}) {
	const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

	return (
		<div className="mb-4 last:mb-0">
			<div className="flex justify-between mb-1">
				<span className="font-mono text-sm truncate">{path}</span>
				<span className="font-bold">{count}</span>
			</div>
			<div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full"
					style={{ width: `${percentage}%`, background: color }}
				/>
			</div>
			{lastActive && (
				<div className="text-xs text-[var(--color-text-subtle)] mt-1">
					Last active: {formatRelativeTime(lastActive)}
				</div>
			)}
		</div>
	);
}

function ProjectDetailPage() {
	const { id: projectId } = Route.useParams();
	const { isAuthenticated, isLoading: authLoading, org } = useAuth();
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<TabId>("endpoints");
	const [endpointModalOpen, setEndpointModalOpen] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
		null,
	);
	const [prefillData, setPrefillData] = useState<{
		method: HttpMethod;
		path: string;
	} | null>(null);

	const { data: project, isLoading: projectLoading } = useQuery({
		queryKey: ["project", projectId],
		queryFn: () => getProject(projectId),
		enabled: isAuthenticated,
	});

	const { data: endpoints = [], isLoading: endpointsLoading } = useQuery({
		queryKey: ["endpoints", projectId],
		queryFn: () => getEndpoints(projectId),
		enabled: isAuthenticated,
	});

	const { data: statistics } = useQuery({
		queryKey: ["statistics", projectId],
		queryFn: () => getProjectStatistics(projectId),
		refetchInterval: 5000,
		enabled: isAuthenticated,
	});

	const { data: logsData } = useQuery({
		queryKey: ["logs", projectId, { limit: 100 }],
		queryFn: () => getRequestLogs(projectId, { limit: 100 }),
		refetchInterval: 5000,
		enabled: isAuthenticated && activeTab === "analytics",
	});

	const statsMap = new Map(
		statistics?.endpoints.map((s) => [s.endpointId, s]) ?? [],
	);

	const totalRequests =
		statistics?.endpoints.reduce((sum, e) => sum + e.requestCount, 0) ?? 0;
	const unmatchedCount =
		statistics?.unmatched.reduce((sum, u) => sum + u.count, 0) ?? 0;
	const activeEndpoints =
		statistics?.endpoints.filter((e) => e.requestCount > 0).length ?? 0;

	const topEndpoints = [...(statistics?.endpoints ?? [])]
		.sort((a, b) => b.requestCount - a.requestCount)
		.slice(0, 5);
	const maxEndpointCount = topEndpoints[0]?.requestCount ?? 0;

	const mockUrl =
		project && org
			? `http://localhost:4000/mock/${org.slug}/${project.slug}`
			: "";

	function handleCopyUrl() {
		navigator.clipboard.writeText(mockUrl);
	}

	function handleNewEndpoint() {
		setSelectedEndpoint(null);
		setPrefillData(null);
		setEndpointModalOpen(true);
	}

	function handleCreateFromUnmatched(unmatched: UnmatchedRequest) {
		setSelectedEndpoint(null);
		setPrefillData({
			method: unmatched.method as HttpMethod,
			path: unmatched.path,
		});
		setEndpointModalOpen(true);
	}

	function handleEditEndpoint(endpoint: Endpoint) {
		setSelectedEndpoint(endpoint);
		setEndpointModalOpen(true);
	}

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

	if (projectLoading) {
		return (
			<div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
				<div className="text-[var(--color-text-muted)]">Loading...</div>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
				<div className="text-[var(--color-text-muted)]">Project not found</div>
			</div>
		);
	}

	const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
		{
			id: "endpoints",
			label: "Endpoints",
			icon: <Layers className="h-4 w-4" />,
		},
		{ id: "logs", label: "Logs", icon: <ScrollText className="h-4 w-4" /> },
		{
			id: "analytics",
			label: "Analytics",
			icon: <BarChart3 className="h-4 w-4" />,
		},
		{
			id: "settings",
			label: "Settings",
			icon: <Settings className="h-4 w-4" />,
		},
	];

	const colors = [
		"var(--color-accent-1)",
		"var(--color-accent-2)",
		"var(--color-accent-3)",
	];

	return (
		<div className="min-h-screen bg-[var(--color-bg)]">
			<Navbar />

			<main className="relative z-10 mx-auto max-w-7xl px-6 py-8 md:px-12">
				<Link
					to="/dashboard"
					className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Projects
				</Link>

				<div className="glass rounded-2xl overflow-hidden">
					<div className="grid grid-cols-[280px_1fr] min-h-[600px]">
						{/* Sidebar */}
						<div className="border-r border-white/10 p-6">
							<div className="mb-6">
								<h2 className="text-lg font-bold mb-1">{project.name}</h2>
								<div className="text-sm text-[var(--color-text-muted)]">
									Production
								</div>
							</div>

							<div className="mb-6">
								<div className="flex items-center gap-2 mb-2">
									<code className="text-xs bg-white/5 px-2 py-1 rounded font-mono text-[var(--color-text-muted)] truncate flex-1">
										{mockUrl}
									</code>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={handleCopyUrl}
									>
										<Copy className="h-3 w-3" />
									</Button>
								</div>
							</div>

							<nav className="space-y-1">
								{navItems.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => setActiveTab(item.id)}
										className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
											activeTab === item.id
												? "bg-white/10 text-white border border-white/10"
												: "text-white/60 hover:bg-white/5 hover:text-white"
										}`}
									>
										{item.icon}
										{item.label}
									</button>
								))}
							</nav>
						</div>

						{/* Main Content */}
						<div className="p-6 overflow-y-auto">
							{/* Unmatched Requests Banner */}
							{statistics &&
								statistics.unmatched.length > 0 &&
								activeTab === "endpoints" && (
									<div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
										<div className="flex items-center gap-2 mb-3">
											<AlertTriangle className="h-4 w-4 text-amber-500" />
											<span className="text-sm font-medium text-amber-500">
												{statistics.unmatched.length} unmatched request
												{statistics.unmatched.length > 1 ? "s" : ""}
											</span>
										</div>
										<div className="space-y-2">
											{statistics.unmatched.slice(0, 5).map((u) => (
												<div
													key={`${u.method}-${u.path}`}
													className="flex items-center gap-3 text-sm"
												>
													<MethodBadge method={u.method as HttpMethod} />
													<span className="flex-1 font-mono text-[var(--color-text-muted)]">
														{u.path}
													</span>
													<span className="text-xs text-[var(--color-text-subtle)]">
														{u.count}x
													</span>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 text-xs"
														onClick={() => handleCreateFromUnmatched(u)}
													>
														<Plus className="h-3 w-3 mr-1" />
														Create
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Endpoints Tab */}
							{activeTab === "endpoints" && (
								<div>
									<div className="flex justify-between items-center mb-6">
										<h3 className="text-xl font-bold">Endpoints</h3>
										<div className="flex gap-2">
											<Button
												variant="secondary"
												onClick={() => setImportModalOpen(true)}
												className="rounded-full"
											>
												Import Spec
											</Button>
											<Button
												onClick={handleNewEndpoint}
												className="bg-white text-black hover:bg-gray-200 rounded-full"
											>
												+ Add Endpoint
											</Button>
										</div>
									</div>

									{endpointsLoading ? (
										<div className="space-y-3">
											{[1, 2, 3].map((i) => (
												<div
													key={i}
													className="h-16 rounded-xl bg-white/[0.02] animate-pulse"
												/>
											))}
										</div>
									) : endpoints.length === 0 ? (
										<EmptyState
											icon={RouteIcon}
											title="No endpoints yet"
											description="Create endpoints manually or import from an OpenAPI spec."
											action={{
												label: "Create Endpoint",
												onClick: handleNewEndpoint,
											}}
										/>
									) : (
										<div className="space-y-3">
											{endpoints.map((endpoint) => (
												<EndpointRow
													key={endpoint.id}
													endpoint={endpoint}
													projectId={projectId}
													stat={statsMap.get(endpoint.id)}
													onEdit={() => handleEditEndpoint(endpoint)}
												/>
											))}
										</div>
									)}
								</div>
							)}

							{/* Logs Tab */}
							{activeTab === "logs" && (
								<div>
									<h3 className="text-xl font-bold mb-6">Request Logs</h3>
									<RequestLogTable projectId={projectId} />
								</div>
							)}

							{/* Analytics Tab */}
							{activeTab === "analytics" && (
								<div>
									<div className="flex justify-between items-center mb-6">
										<h3 className="text-xl font-bold">Traffic Overview</h3>
									</div>

									{/* Stats Grid */}
									<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
										<StatCard
											label="Total Requests"
											value={totalRequests.toLocaleString()}
											color="white"
										/>
										<StatCard
											label="Unmatched (404s)"
											value={unmatchedCount}
											subtext={
												totalRequests > 0
													? `${((unmatchedCount / totalRequests) * 100).toFixed(1)}% error rate`
													: undefined
											}
											color="warning"
										/>
										<StatCard
											label="Avg Latency"
											value="—"
											subtext="Coming soon"
											color="accent-2"
										/>
										<StatCard
											label="Active Endpoints"
											value={`${activeEndpoints}/${endpoints.length}`}
											subtext={
												endpoints.length - activeEndpoints > 0
													? `${endpoints.length - activeEndpoints} unused`
													: undefined
											}
											color="accent-1"
										/>
									</div>

									<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
										{/* Live Log Preview */}
										<div>
											<h4 className="text-sm font-bold mb-4">
												Live Request Log
											</h4>
											<div className="glass rounded-xl overflow-hidden">
												<table className="w-full text-sm">
													<thead className="bg-white/[0.02]">
														<tr className="border-b border-white/10">
															<th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
																Time
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
														{logsData?.logs.slice(0, 5).map((log) => (
															<tr
																key={log.id}
																className={`border-b border-white/5 ${log.status >= 400 ? "bg-[var(--color-warning)]/5" : ""}`}
															>
																<td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">
																	{new Date(log.createdAt).toLocaleTimeString()}
																</td>
																<td className="px-4 py-3">
																	<MethodBadge
																		method={log.method as HttpMethod}
																	/>
																</td>
																<td className="px-4 py-3 font-mono">
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
														)) ?? (
															<tr>
																<td
																	colSpan={4}
																	className="px-4 py-8 text-center text-[var(--color-text-muted)]"
																>
																	No requests yet
																</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										</div>

										{/* Top Endpoints */}
										<div>
											<h4 className="text-sm font-bold mb-4">Top Endpoints</h4>
											<div className="glass rounded-xl p-4">
												{topEndpoints.length === 0 ? (
													<div className="text-center text-[var(--color-text-muted)] py-4">
														No traffic yet
													</div>
												) : (
													topEndpoints.map((stat, index) => {
														const endpoint = endpoints.find(
															(e) => e.id === stat.endpointId,
														);
														return (
															<TopEndpointBar
																key={stat.endpointId}
																path={endpoint?.path ?? "Unknown"}
																count={stat.requestCount}
																maxCount={maxEndpointCount}
																color={colors[index % colors.length]}
																lastActive={stat.lastRequestAt}
															/>
														);
													})
												)}
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Settings Tab */}
							{activeTab === "settings" && (
								<div>
									<h3 className="text-xl font-bold mb-6">Settings</h3>
									<div className="text-[var(--color-text-muted)]">
										Project settings coming soon...
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>

			{/* Modals */}
			<EndpointForm
				projectId={projectId}
				endpoint={selectedEndpoint ?? undefined}
				prefill={prefillData ?? undefined}
				open={endpointModalOpen}
				onOpenChange={setEndpointModalOpen}
			/>

			<ImportModal
				projectId={projectId}
				open={importModalOpen}
				onOpenChange={setImportModalOpen}
			/>
		</div>
	);
}
