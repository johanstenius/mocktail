"use client";

import { CopyButton } from "@/components/copy-button";
import { EndpointPanel } from "@/components/endpoint-panel";
import { ImportDropzone } from "@/components/import-dropzone";
import { ImportModal } from "@/components/import-modal";
import { MethodBadge } from "@/components/method-badge";
import { PageHeader } from "@/components/page-header";
import { RequestLogTable } from "@/components/request-log-table";
import { EndpointRowSkeleton, Skeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	deleteEndpoint,
	getEndpoints,
	getProject,
	getProjectStatistics,
	getUsage,
	rotateProjectApiKey,
	updateProject,
} from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { createSSEConnection } from "@/lib/sse";
import { getCurlCommand, getMockBaseUrl, getMockUrl } from "@/lib/url";
import type {
	Endpoint,
	HttpMethod,
	Project,
	ProjectStatistics,
	UpdateProjectInput,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	FolderOpen,
	Loader2,
	Plus,
	RefreshCw,
	Route as RouteIcon,
	Trash2,
	TrendingUp,
	Upload,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TabId = "endpoints" | "logs" | "analytics" | "settings";

function EndpointRow({
	endpoint,
	projectId,
	apiKey,
	stat,
	variantCount,
	onClick,
	hasProxyBaseUrl,
}: {
	endpoint: Endpoint;
	projectId: string;
	apiKey: string;
	stat?: { requestCount: number };
	variantCount?: number;
	onClick: () => void;
	hasProxyBaseUrl: boolean;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const queryClient = useQueryClient();
	const mockUrl = getMockUrl(endpoint.path);
	const curlCommand = getCurlCommand(endpoint.method, mockUrl, apiKey);

	const deleteMutation = useMutation({
		mutationFn: () => deleteEndpoint(projectId, endpoint.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			toast.success("Endpoint deleted");
		},
		onError: () => {
			toast.error("Failed to delete endpoint");
		},
	});

	return (
		<div
			role="button"
			tabIndex={0}
			className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)] hover:translate-x-1 transition-all cursor-pointer"
			onClick={onClick}
			onKeyDown={(e) => e.key === "Enter" && onClick()}
		>
			<div className="flex items-center gap-4">
				<MethodBadge method={endpoint.method} className="w-16 justify-center" />
				<div>
					<h3 className="font-['JetBrains_Mono'] font-medium text-[var(--text-primary)]">
						{endpoint.path}
					</h3>
					<div className="font-['JetBrains_Mono'] text-xs text-[var(--text-muted)]">
						→ {endpoint.status}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-4">
				{endpoint.proxyEnabled && hasProxyBaseUrl && (
					<Badge
						variant="outline"
						className="border-[var(--glow-blue)]/30 text-[var(--glow-blue)]"
					>
						PROXY
					</Badge>
				)}
				{variantCount !== undefined && variantCount > 1 && (
					<Badge
						variant="outline"
						className="border-[var(--glow-violet)]/30 text-[var(--glow-violet)]"
					>
						{variantCount} variants
					</Badge>
				)}
				{stat && stat.requestCount > 0 && (
					<Badge variant="default">{stat.requestCount} Hits</Badge>
				)}
				<div
					className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<CopyButton
						value={mockUrl}
						label="Copy URL"
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
					/>
					<CopyButton
						value={curlCommand}
						label="Copy cURL"
						variant="ghost"
						size="sm"
						className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-['JetBrains_Mono'] text-xs"
					>
						cURL
					</CopyButton>

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
							className="h-8 w-8 text-[var(--text-muted)] hover:text-red-400"
							onClick={() => setShowConfirm(true)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

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

function EndpointStatBar({
	method,
	path,
	requestCount,
	maxCount,
}: {
	method: HttpMethod;
	path: string;
	requestCount: number;
	maxCount: number;
}) {
	const percentage = maxCount > 0 ? (requestCount / maxCount) * 100 : 0;

	return (
		<div className="mb-4 last:mb-0">
			<div className="flex justify-between items-center mb-1">
				<div className="flex items-center gap-2">
					<MethodBadge method={method} />
					<span className="font-['JetBrains_Mono'] text-sm">{path}</span>
				</div>
				<span className="font-bold tabular-nums font-['JetBrains_Mono'] text-sm">
					{requestCount.toLocaleString()}
				</span>
			</div>
			<div className="h-2 bg-white/10 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-500 bg-[var(--glow-violet)]"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

function ProjectAnalytics({
	statistics,
	endpoints,
}: {
	statistics: ProjectStatistics | undefined;
	endpoints: Endpoint[];
}) {
	const totalRequests =
		statistics?.endpoints.reduce((sum, e) => sum + e.requestCount, 0) ?? 0;
	const totalUnmatched =
		statistics?.unmatched.reduce((sum, u) => sum + u.count, 0) ?? 0;
	const maxEndpointRequests = Math.max(
		...(statistics?.endpoints.map((e) => e.requestCount) ?? [1]),
		1,
	);

	const endpointMap = new Map(endpoints.map((e) => [e.id, e]));
	const sortedEndpointStats = [...(statistics?.endpoints ?? [])].sort(
		(a, b) => b.requestCount - a.requestCount,
	);

	return (
		<div>
			<h3 className="text-xl font-bold mb-6 font-['Outfit']">
				Traffic Overview
			</h3>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard
					label="Total Requests"
					value={totalRequests.toLocaleString()}
					color="white"
				/>
				<StatCard
					label="Unmatched"
					value={totalUnmatched}
					subtext={
						totalRequests > 0
							? `${((totalUnmatched / Math.max(totalRequests + totalUnmatched, 1)) * 100).toFixed(1)}% miss rate`
							: undefined
					}
					color="warning"
				/>
				<StatCard label="Endpoints" value={endpoints.length} color="violet" />
				<StatCard
					label="Avg Latency"
					value={
						statistics?.avgLatency != null ? `${statistics.avgLatency}ms` : "—"
					}
					subtext={
						statistics?.avgLatency != null
							? "across all requests"
							: "No data yet"
					}
					color="blue"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div>
					<h4 className="text-lg font-bold mb-4 font-['Outfit']">
						Traffic by Endpoint
					</h4>
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
						{sortedEndpointStats.length === 0 ? (
							<div className="text-center text-[var(--text-muted)] py-4">
								No traffic yet
							</div>
						) : (
							sortedEndpointStats.slice(0, 10).map((stat) => {
								const endpoint = endpointMap.get(stat.endpointId);
								if (!endpoint) return null;
								return (
									<EndpointStatBar
										key={stat.endpointId}
										method={endpoint.method}
										path={endpoint.path}
										requestCount={stat.requestCount}
										maxCount={maxEndpointRequests}
									/>
								);
							})
						)}
					</div>
				</div>

				<div>
					<h4 className="text-lg font-bold mb-4 font-['Outfit']">
						Unmatched Requests
					</h4>
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
						{(statistics?.unmatched ?? []).length === 0 ? (
							<div className="text-center text-[var(--text-muted)] py-4">
								No unmatched requests
							</div>
						) : (
							<div className="space-y-3">
								{statistics?.unmatched.slice(0, 10).map((req, index) => (
									<div
										key={`${req.method}-${req.path}-${index}`}
										className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl"
									>
										<div className="flex items-center gap-2">
											<MethodBadge method={req.method as HttpMethod} />
											<span className="font-['JetBrains_Mono'] text-sm truncate max-w-[200px]">
												{req.path}
											</span>
										</div>
										<span className="text-amber-400 font-bold tabular-nums text-sm">
											{req.count}x
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ProjectSettings({
	projectId,
	project,
}: {
	projectId: string;
	project: Project;
}) {
	const [showConfirmRotate, setShowConfirmRotate] = useState(false);
	const [proxyBaseUrl, setProxyBaseUrl] = useState(project.proxyBaseUrl ?? "");
	const [proxyTimeout, setProxyTimeout] = useState(project.proxyTimeout);
	const [proxyPassThroughAuth, setProxyPassThroughAuth] = useState(
		project.proxyPassThroughAuth,
	);
	const [proxyAuthHeader, setProxyAuthHeader] = useState(
		project.proxyAuthHeader ?? "",
	);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const queryClient = useQueryClient();

	const rotateMutation = useMutation({
		mutationFn: () => rotateProjectApiKey(projectId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["project", projectId] });
			toast.success("API key rotated");
			setShowConfirmRotate(false);
		},
		onError: () => {
			toast.error("Failed to rotate API key");
		},
	});

	const updateProxyMutation = useMutation({
		mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["project", projectId] });
			toast.success("Proxy settings saved");
		},
		onError: () => {
			toast.error("Failed to save proxy settings");
		},
	});

	function handleSaveProxy() {
		updateProxyMutation.mutate({
			proxyBaseUrl: proxyBaseUrl.trim() || null,
			proxyTimeout,
			proxyPassThroughAuth,
			proxyAuthHeader: proxyAuthHeader.trim() || null,
		});
	}

	const exampleCurl = getCurlCommand(
		"GET",
		`${getMockBaseUrl()}/users`,
		project.apiKey,
	);

	const hasProxyChanges =
		proxyBaseUrl !== (project.proxyBaseUrl ?? "") ||
		proxyTimeout !== project.proxyTimeout ||
		proxyPassThroughAuth !== project.proxyPassThroughAuth ||
		proxyAuthHeader !== (project.proxyAuthHeader ?? "");

	return (
		<div>
			<h3 className="text-xl font-bold mb-6 font-['Outfit']">Settings</h3>

			<div className="space-y-6">
				<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
					<h4 className="text-lg font-semibold mb-2 font-['Outfit']">
						Proxy Mode
					</h4>
					<p className="text-sm text-[var(--text-muted)] mb-4">
						Forward requests to a real API. Unmatched requests will be proxied
						when a base URL is set.
					</p>

					<div className="space-y-4">
						<div>
							<Label htmlFor="proxyBaseUrl">Upstream Base URL</Label>
							<Input
								id="proxyBaseUrl"
								value={proxyBaseUrl}
								onChange={(e) => setProxyBaseUrl(e.target.value)}
								placeholder="https://api.example.com"
								className="mt-1.5 font-mono"
							/>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								Leave empty to disable proxy mode
							</p>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setProxyPassThroughAuth(!proxyPassThroughAuth)}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${proxyPassThroughAuth ? "bg-[var(--glow-violet)]" : "bg-white/10"}`}
							>
								<span
									className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${proxyPassThroughAuth ? "translate-x-4.5" : "translate-x-1"}`}
								/>
							</button>
							<Label htmlFor="proxyPassThroughAuth" className="cursor-pointer">
								Pass through incoming Authorization header
							</Label>
						</div>

						{!proxyPassThroughAuth && (
							<div>
								<Label htmlFor="proxyAuthHeader">Upstream Auth Header</Label>
								<Input
									id="proxyAuthHeader"
									value={proxyAuthHeader}
									onChange={(e) => setProxyAuthHeader(e.target.value)}
									placeholder="Bearer <token> or Basic <base64>"
									className="mt-1.5 font-mono"
								/>
								<p className="text-xs text-[var(--text-muted)] mt-1">
									Sent as Authorization header to upstream
								</p>
							</div>
						)}

						<button
							type="button"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1"
						>
							{showAdvanced ? "▼" : "▶"} Advanced settings
						</button>

						{showAdvanced && (
							<div>
								<Label htmlFor="proxyTimeout">Timeout (ms)</Label>
								<Input
									id="proxyTimeout"
									type="number"
									min={1000}
									max={60000}
									value={proxyTimeout}
									onChange={(e) => setProxyTimeout(Number(e.target.value))}
									className="mt-1.5 w-32"
								/>
							</div>
						)}

						<Button
							onClick={handleSaveProxy}
							disabled={!hasProxyChanges || updateProxyMutation.isPending}
							size="sm"
						>
							{updateProxyMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Save Proxy Settings
						</Button>
					</div>
				</div>

				<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
					<h4 className="text-lg font-semibold mb-4 font-['Outfit']">
						API Key
					</h4>
					<p className="text-sm text-[var(--text-muted)] mb-4">
						Use this key to authenticate requests to your mock endpoints.
						Include it in the{" "}
						<code className="text-[var(--glow-violet)]">X-API-Key</code> header,
						or use{" "}
						<code className="text-[var(--glow-violet)]">
							Authorization: Bearer
						</code>{" "}
						/<code className="text-[var(--glow-violet)]">Basic</code> auth.
					</p>

					<div className="flex items-center gap-2 mb-4">
						<code className="flex-1 text-[var(--text-primary)] font-['JetBrains_Mono'] text-sm bg-[rgba(0,0,0,0.3)] px-4 py-3 rounded-xl border border-[var(--border-subtle)]">
							{project.apiKey}
						</code>
						<CopyButton
							value={project.apiKey}
							label="Copy API key"
							variant="outline"
							size="icon"
							className="h-10 w-10"
						/>
					</div>

					<div className="flex items-center gap-2">
						{showConfirmRotate ? (
							<>
								<span className="text-sm text-amber-400">
									This will invalidate the current key immediately.
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowConfirmRotate(false)}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => rotateMutation.mutate()}
									disabled={rotateMutation.isPending}
								>
									{rotateMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : null}
									Confirm Rotate
								</Button>
							</>
						) : (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowConfirmRotate(true)}
								className="text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Rotate Key
							</Button>
						)}
					</div>
				</div>

				<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
					<h4 className="text-lg font-semibold mb-4 font-['Outfit']">
						Example Usage
					</h4>
					<div className="relative">
						<pre className="text-[var(--text-secondary)] font-['JetBrains_Mono'] text-sm bg-[rgba(0,0,0,0.3)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] overflow-x-auto">
							{exampleCurl}
						</pre>
						<CopyButton
							value={exampleCurl}
							label="Copy example"
							variant="ghost"
							size="icon"
							className="absolute top-2 right-2 h-8 w-8"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ProjectDetailPage() {
	const params = useParams<{ id: string }>();
	const projectId = params.id;
	const { data: session } = useSession();
	const isAuthenticated = !!session;

	const [activeTab, setActiveTab] = useState<TabId>("endpoints");
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [endpointPanelOpen, setEndpointPanelOpen] = useState(false);
	const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
		null,
	);

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

	const { data: usage } = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
		enabled: isAuthenticated,
	});

	const endpointLimitReached =
		usage?.endpoints.limit !== null &&
		usage?.endpoints.current !== undefined &&
		usage.endpoints.current >= usage.endpoints.limit;

	const queryClient = useQueryClient();

	const { data: statistics } = useQuery({
		queryKey: ["statistics", projectId],
		queryFn: () => getProjectStatistics(projectId),
		enabled: isAuthenticated,
	});

	useEffect(() => {
		if (!isAuthenticated || !projectId) return;

		let connection: ReturnType<typeof createSSEConnection> | null = null;
		try {
			connection = createSSEConnection("project", projectId);

			connection.on("stats.initial", (payload) => {
				queryClient.setQueryData(["statistics", projectId], payload);
			});

			connection.on("stats.updated", () => {
				queryClient.invalidateQueries({ queryKey: ["statistics", projectId] });
			});
		} catch {
			// SSE connection failed, stats will be fetched once via React Query
		}

		return () => {
			connection?.close();
		};
	}, [isAuthenticated, projectId, queryClient]);

	const statsMap = new Map(
		statistics?.endpoints.map((s) => [s.endpointId, s]) ?? [],
	);

	function handleNewEndpoint() {
		setSelectedEndpoint(null);
		setEndpointPanelOpen(true);
	}

	function handleEndpointClick(endpoint: Endpoint) {
		setSelectedEndpoint(endpoint);
		setEndpointPanelOpen(true);
	}

	if (projectLoading) {
		return (
			<main className="flex-1 flex flex-col overflow-hidden">
				<header className="h-20 px-8 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(5,5,5,0.3)] backdrop-blur-md">
					<div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-['Inter']">
						<Skeleton className="h-4 w-16" />
						<span className="opacity-50">/</span>
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-9 w-36 rounded-lg" />
				</header>
				<div className="flex-1 overflow-y-auto p-8">
					<div className="max-w-7xl mx-auto">
						<div className="mb-6">
							<Skeleton className="h-9 w-48 mb-2" />
							<Skeleton className="h-7 w-64 rounded-lg" />
						</div>
						<Skeleton className="h-12 w-full rounded-2xl mb-6" />
						<div className="space-y-2">
							<EndpointRowSkeleton />
							<EndpointRowSkeleton />
							<EndpointRowSkeleton />
						</div>
					</div>
				</div>
			</main>
		);
	}

	if (!project) {
		return (
			<div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
				<div className="text-[var(--color-text-muted)]">Project not found</div>
			</div>
		);
	}

	const navItems: { id: TabId; label: string }[] = [
		{ id: "endpoints", label: "Endpoints" },
		{ id: "logs", label: "Logs" },
		{ id: "analytics", label: "Analytics" },
		{ id: "settings", label: "Settings" },
	];

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				breadcrumbs={[
					{ label: "Projects", href: "/projects" },
					{ label: project.name },
				]}
				icon={<FolderOpen className="h-4 w-4 text-[var(--glow-violet)]" />}
				actions={
					<div className="flex items-center gap-3">
						{endpointLimitReached && (
							<span className="text-xs text-[var(--status-warning)] flex items-center gap-1">
								<AlertCircle className="h-3 w-3" />
								Endpoint limit reached
							</span>
						)}
						<Button
							variant="outline"
							onClick={handleNewEndpoint}
							disabled={endpointLimitReached}
							className="border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create Endpoint
						</Button>
						<Button
							onClick={() => setImportModalOpen(true)}
							disabled={endpointLimitReached}
							className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Upload className="h-4 w-4 mr-2" />
							Import Spec
						</Button>
					</div>
				}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-7xl mx-auto">
					<div className="mb-6">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							{project.name}
						</h1>
						<div className="flex items-center gap-2">
							<code className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm bg-[var(--bg-surface)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
								{getMockBaseUrl()}
							</code>
							<CopyButton
								value={getMockBaseUrl()}
								label="Copy base URL"
								variant="ghost"
								size="icon"
								className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
							/>
						</div>
					</div>

					<div className="flex justify-between items-center mb-6 bg-[var(--bg-surface)] p-2 rounded-2xl border border-[var(--border-subtle)]">
						<div className="flex items-center gap-1 bg-[rgba(0,0,0,0.3)] p-1 rounded-xl">
							{navItems.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => setActiveTab(item.id)}
									className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
										activeTab === item.id
											? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-[0_0_10px_rgba(0,0,0,0.2)]"
											: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
						<div className="relative">
							<svg
								className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							<input
								type="text"
								placeholder="Search endpoints..."
								className="bg-[rgba(0,0,0,0.3)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-60 transition-all duration-200 focus:outline-none focus:border-[var(--glow-violet)] focus:shadow-[0_0_0_2px_rgba(139,92,246,0.2)]"
							/>
						</div>
					</div>

					{activeTab === "endpoints" && (
						<div className="space-y-2">
							{endpointsLoading ? (
								<div className="space-y-2">
									<EndpointRowSkeleton />
									<EndpointRowSkeleton />
									<EndpointRowSkeleton />
								</div>
							) : endpoints.length === 0 ? (
								<div className="flex flex-col items-center py-12">
									<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] mb-4">
										<RouteIcon className="h-8 w-8 text-[var(--text-muted)]" />
									</div>
									<h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 font-['Outfit']">
										No endpoints yet
									</h3>
									<p className="text-sm text-[var(--text-muted)] mb-6">
										Import from an OpenAPI spec or{" "}
										<button
											type="button"
											onClick={handleNewEndpoint}
											disabled={endpointLimitReached}
											className={`${endpointLimitReached ? "text-[var(--text-muted)] cursor-not-allowed" : "text-[var(--glow-violet)] hover:underline"}`}
										>
											create one manually
										</button>
									</p>
									{!endpointLimitReached && (
										<ImportDropzone
											projectId={projectId}
											variant="compact"
											autoImport
										/>
									)}
								</div>
							) : (
								<div className="space-y-2">
									{endpoints.map((endpoint) => (
										<EndpointRow
											key={endpoint.id}
											endpoint={endpoint}
											projectId={projectId}
											apiKey={project.apiKey}
											stat={statsMap.get(endpoint.id)}
											onClick={() => handleEndpointClick(endpoint)}
											hasProxyBaseUrl={!!project.proxyBaseUrl}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === "logs" && (
						<div>
							<h3 className="text-xl font-bold mb-6 font-['Outfit']">
								Request Logs
							</h3>
							<RequestLogTable projectId={projectId} />
						</div>
					)}

					{activeTab === "analytics" && (
						<ProjectAnalytics statistics={statistics} endpoints={endpoints} />
					)}

					{activeTab === "settings" && (
						<ProjectSettings projectId={projectId} project={project} />
					)}
				</div>
			</div>

			<ImportModal
				projectId={projectId}
				open={importModalOpen}
				onOpenChange={setImportModalOpen}
			/>

			<EndpointPanel
				projectId={projectId}
				apiKey={project.apiKey}
				endpoint={selectedEndpoint}
				open={endpointPanelOpen}
				onOpenChange={setEndpointPanelOpen}
				proxyBaseUrl={project.proxyBaseUrl}
			/>
		</main>
	);
}
