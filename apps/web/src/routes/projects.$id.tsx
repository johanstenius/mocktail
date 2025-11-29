import { EmptyState } from "@/components/empty-state";
import { EndpointForm } from "@/components/endpoint-form";
import { ImportModal } from "@/components/import-modal";
import { MethodBadge } from "@/components/method-badge";
import { Navbar } from "@/components/navbar";
import { RequestLogTable } from "@/components/request-log-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	deleteEndpoint,
	getEndpoints,
	getProject,
	getProjectStatistics,
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
	Copy,
	FileJson,
	Loader2,
	Plus,
	Route as RouteIcon,
	Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/projects/$id")({
	component: ProjectDetailPage,
});

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
		// biome-ignore lint/a11y/useSemanticElements: div used for complex layout
		<div
			role="button"
			tabIndex={0}
			className="group flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
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
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Parent handles keyboard */}
			<div
				className="flex items-center gap-1"
				onClick={(e) => e.stopPropagation()}
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

function ProjectDetailPage() {
	const { id: projectId } = Route.useParams();
	const { isAuthenticated, isLoading: authLoading, org } = useAuth();
	const navigate = useNavigate();

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

	return (
		<div className="min-h-screen bg-[var(--color-bg)]">
			{/* Ambient glow */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				<div className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--color-primary)] rounded-full blur-[120px] opacity-30" />
			</div>

			<Navbar
				actions={
					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							onClick={() => setImportModalOpen(true)}
						>
							<FileJson className="h-4 w-4" />
							Import
						</Button>
						<Button onClick={handleNewEndpoint}>
							<Plus className="h-4 w-4" />
							New Endpoint
						</Button>
					</div>
				}
			/>

			<main className="relative z-10 mx-auto max-w-5xl px-6 py-8 md:px-12">
				{/* Back + Header */}
				<Link
					to="/dashboard"
					className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Projects
				</Link>

				<div className="mb-8">
					<h1 className="text-2xl font-semibold tracking-tight">
						{project.name}
					</h1>
					<div className="mt-2 flex items-center gap-3">
						<code className="rounded-lg bg-white/5 px-3 py-1.5 font-mono text-sm text-[var(--color-text-muted)]">
							{mockUrl}
						</code>
						<Button variant="ghost" size="icon" onClick={handleCopyUrl}>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Unmatched Requests */}
				{statistics && statistics.unmatched.length > 0 && (
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

				{/* Tabs */}
				<Tabs defaultValue="endpoints">
					<TabsList>
						<TabsTrigger value="endpoints">Endpoints</TabsTrigger>
						<TabsTrigger value="logs">Request Logs</TabsTrigger>
					</TabsList>

					<TabsContent value="endpoints">
						{endpointsLoading ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-16 rounded-lg bg-white/[0.02] animate-pulse"
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
					</TabsContent>

					<TabsContent value="logs">
						<RequestLogTable projectId={projectId} />
					</TabsContent>
				</Tabs>
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
