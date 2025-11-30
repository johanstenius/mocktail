import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { EndpointForm } from "@/components/endpoint-form";
import { ImportModal } from "@/components/import-modal";
import { MethodBadge } from "@/components/method-badge";
import { RequestLogTable } from "@/components/request-log-table";
import { EndpointRowSkeleton, Skeleton } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import {
	deleteEndpoint,
	getEndpoints,
	getProject,
	getProjectStatistics,
	rotateProjectApiKey,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getCurlCommand, getMockBaseUrl, getMockUrl } from "@/lib/url";
import type { Endpoint, HttpMethod, ProjectStatistics } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Loader2,
	Plus,
	RefreshCw,
	Route as RouteIcon,
	Trash2,
	TrendingUp,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/project/$id")({
	component: ProjectDetailPage,
});

type TabId = "endpoints" | "logs" | "analytics" | "settings";

import { Badge } from "@/components/ui/badge";

function EndpointRow({
	endpoint,
	projectId,
	apiKey,
	stat,
	onEdit,
}: {
	endpoint: Endpoint;
	projectId: string;
	apiKey: string;
	stat?: { requestCount: number };
	onEdit: () => void;
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
		// biome-ignore lint/a11y/useSemanticElements: Using div for complex layout with nested interactive elements
		<div
			role="button"
			tabIndex={0}
			className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)] hover:translate-x-1 transition-all cursor-pointer"
			onClick={onEdit}
			onKeyDown={(e) => e.key === "Enter" && onEdit()}
		>
			<div className="flex items-center gap-4">
				<div>
					<div className="flex items-center gap-3 mb-1">
						<h3 className="font-['Outfit'] font-semibold text-[var(--text-primary)]">
							{endpoint.path}
						</h3>
					</div>
					<div className="font-['JetBrains_Mono'] text-xs text-[var(--text-muted)]">
						Status: {endpoint.status}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-4">
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

			{/* Stats Grid */}
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
					value="—"
					subtext="Coming soon"
					color="blue"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Traffic by Endpoint */}
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

				{/* Unmatched Requests */}
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
	apiKey,
}: {
	projectId: string;
	apiKey: string;
}) {
	const [showConfirmRotate, setShowConfirmRotate] = useState(false);
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

	const exampleCurl = getCurlCommand(
		"GET",
		`${getMockBaseUrl()}/users`,
		apiKey,
	);

	return (
		<div>
			<h3 className="text-xl font-bold mb-6 font-['Outfit']">Settings</h3>

			<div className="space-y-6">
				{/* API Key Section */}
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
							{apiKey}
						</code>
						<CopyButton
							value={apiKey}
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

				{/* Example Usage */}
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

function ProjectDetailPage() {
	const { id: projectId } = Route.useParams();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
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

	const statsMap = new Map(
		statistics?.endpoints.map((s) => [s.endpointId, s]) ?? [],
	);

	function handleNewEndpoint() {
		setSelectedEndpoint(null);
		setPrefillData(null);
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
			{/* Header */}
			<header className="h-20 px-8 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(5,5,5,0.3)] backdrop-blur-md">
				<div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-['Inter']">
					<Link
						to="/projects"
						className="hover:text-[var(--text-secondary)] transition-colors"
					>
						Projects
					</Link>
					<span className="opacity-50">/</span>
					<span className="text-[var(--text-primary)] font-medium">
						{project.name}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={handleNewEndpoint}
						className="border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)]"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create Endpoint
					</Button>
					<Button
						onClick={() => setImportModalOpen(true)}
						className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10"
					>
						<Upload className="h-4 w-4 mr-2" />
						Import Spec
					</Button>
				</div>
			</header>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-7xl mx-auto">
					{/* Project Title */}
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

					{/* Controls Bar */}
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

					{/* Endpoints Tab */}
					{activeTab === "endpoints" && (
						<div className="space-y-2">
							{endpointsLoading ? (
								<div className="space-y-2">
									<EndpointRowSkeleton />
									<EndpointRowSkeleton />
									<EndpointRowSkeleton />
								</div>
							) : endpoints.length === 0 ? (
								<EmptyState
									icon={RouteIcon}
									title="No endpoints yet"
									description="Import from an OpenAPI spec or create endpoints manually."
									action={{
										label: "Import Spec",
										onClick: () => setImportModalOpen(true),
									}}
									secondaryAction={{
										label: "Create Endpoint",
										onClick: handleNewEndpoint,
									}}
								/>
							) : (
								<div className="space-y-2">
									{endpoints.map((endpoint) => (
										<EndpointRow
											key={endpoint.id}
											endpoint={endpoint}
											projectId={projectId}
											apiKey={project.apiKey}
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
							<h3 className="text-xl font-bold mb-6 font-['Outfit']">
								Request Logs
							</h3>
							<RequestLogTable projectId={projectId} />
						</div>
					)}

					{/* Analytics Tab */}
					{activeTab === "analytics" && (
						<ProjectAnalytics statistics={statistics} endpoints={endpoints} />
					)}

					{/* Settings Tab */}
					{activeTab === "settings" && (
						<ProjectSettings projectId={projectId} apiKey={project.apiKey} />
					)}
				</div>
			</div>

			{/* Modals */}
			<EndpointForm
				projectId={projectId}
				apiKey={project.apiKey}
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
		</main>
	);
}
