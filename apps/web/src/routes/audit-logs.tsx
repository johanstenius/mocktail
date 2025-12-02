import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { exportAuditLogs, getAuditLogs, getMembers } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { requireAuth } from "@/lib/route-guards";
import type {
	AuditAction,
	AuditLog,
	GetAuditLogsParams,
	Member,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ChevronLeft,
	ChevronRight,
	Download,
	FileJson,
	FileText,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/audit-logs")({
	beforeLoad: requireAuth,
	component: AuditLogsPage,
});

const ACTION_LABELS: Record<AuditAction, string> = {
	org_created: "Organization Created",
	org_updated: "Organization Updated",
	member_invited: "Member Invited",
	member_joined: "Member Joined",
	member_role_changed: "Role Changed",
	member_removed: "Member Removed",
	invite_cancelled: "Invite Cancelled",
	project_created: "Project Created",
	project_updated: "Project Updated",
	project_deleted: "Project Deleted",
	api_key_rotated: "API Key Rotated",
	endpoint_created: "Endpoint Created",
	endpoint_updated: "Endpoint Updated",
	endpoint_deleted: "Endpoint Deleted",
	variant_created: "Variant Created",
	variant_updated: "Variant Updated",
	variant_deleted: "Variant Deleted",
	subscription_created: "Subscription Created",
	subscription_updated: "Subscription Updated",
	subscription_cancelled: "Subscription Cancelled",
};

const ACTION_VARIANTS: Record<
	string,
	"default" | "success" | "destructive" | "violet"
> = {
	org_created: "success",
	org_updated: "default",
	member_invited: "violet",
	member_joined: "success",
	member_role_changed: "default",
	member_removed: "destructive",
	invite_cancelled: "destructive",
	project_created: "success",
	project_updated: "default",
	project_deleted: "destructive",
	api_key_rotated: "violet",
	endpoint_created: "success",
	endpoint_updated: "default",
	endpoint_deleted: "destructive",
	variant_created: "success",
	variant_updated: "default",
	variant_deleted: "destructive",
	subscription_created: "success",
	subscription_updated: "default",
	subscription_cancelled: "destructive",
};

function formatMetadata(metadata: Record<string, unknown>): string {
	const parts: string[] = [];
	if (metadata.email) parts.push(`email: ${metadata.email}`);
	if (metadata.name) parts.push(`name: ${metadata.name}`);
	if (metadata.role) parts.push(`role: ${metadata.role}`);
	if (metadata.method && metadata.path) {
		parts.push(`${metadata.method} ${metadata.path}`);
	}
	if (metadata.changedFields) {
		const fields = metadata.changedFields as string[];
		parts.push(`changed: ${fields.join(", ")}`);
	}
	return parts.join(" | ") || "-";
}

function AuditLogRow({ log }: { log: AuditLog }) {
	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-highlight)] transition-all">
			<div className="flex items-center gap-4 min-w-0 flex-1">
				<div className="w-10 h-10 rounded-full bg-[var(--bg-surface-active)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)]">
					{log.actor?.email?.charAt(0).toUpperCase() ?? "S"}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<Badge variant={ACTION_VARIANTS[log.action] ?? "default"}>
							{ACTION_LABELS[log.action] ?? log.action}
						</Badge>
						<span className="text-sm text-[var(--text-primary)] font-['Inter']">
							{log.actor?.email ?? "System"}
						</span>
					</div>
					<div className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono'] truncate mt-1">
						{formatMetadata(log.metadata)}
					</div>
				</div>
			</div>
			<div className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono'] whitespace-nowrap ml-4">
				{new Date(log.createdAt).toLocaleString()}
			</div>
		</div>
	);
}

function AuditLogSkeleton() {
	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl animate-pulse">
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 rounded-full bg-[var(--bg-surface-active)]" />
				<div className="space-y-2">
					<div className="h-4 w-32 bg-[var(--bg-surface-active)] rounded" />
					<div className="h-3 w-48 bg-[var(--bg-surface-active)] rounded" />
				</div>
			</div>
			<div className="h-3 w-24 bg-[var(--bg-surface-active)] rounded" />
		</div>
	);
}

function AuditLogsPage() {
	const {
		isAuthenticated,
		emailVerifiedAt,
		isLoading: authLoading,
		role,
	} = useAuth();
	const navigate = useNavigate();
	const [page, setPage] = useState(0);
	const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
	const [actorFilter, setActorFilter] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [exporting, setExporting] = useState(false);

	const limit = 20;
	const isVerified = Boolean(emailVerifiedAt);
	const canView = role === "owner" || role === "admin";

	const params: GetAuditLogsParams = {
		limit,
		offset: page * limit,
		...(actionFilter && { action: actionFilter }),
		...(actorFilter && { actorId: actorFilter }),
		...(fromDate && { from: fromDate }),
		...(toDate && { to: toDate }),
	};

	const { data, isLoading } = useQuery({
		queryKey: ["audit-logs", params],
		queryFn: () => getAuditLogs(params),
		enabled: isAuthenticated && isVerified && canView,
	});

	const { data: members = [] } = useQuery({
		queryKey: ["members"],
		queryFn: getMembers,
		enabled: isAuthenticated && isVerified && canView,
	});

	const logs = data?.logs ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / limit);

	async function handleExport(format: "csv" | "json") {
		setExporting(true);
		try {
			const blob = await exportAuditLogs(format, {
				...(actionFilter && { action: actionFilter }),
				...(actorFilter && { actorId: actorFilter }),
				...(fromDate && { from: fromDate }),
				...(toDate && { to: toDate }),
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `audit-logs.${format}`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success(`Exported as ${format.toUpperCase()}`);
		} catch {
			toast.error("Export failed");
		} finally {
			setExporting(false);
		}
	}

	if (authLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!isAuthenticated) {
		navigate({ to: "/login" });
		return null;
	}

	if (!emailVerifiedAt) {
		navigate({ to: "/check-email" });
		return null;
	}

	if (!canView) {
		return (
			<main className="flex-1 flex flex-col items-center justify-center">
				<h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
					Access Denied
				</h1>
				<p className="text-[var(--text-muted)]">
					You need admin or owner access to view audit logs.
				</p>
			</main>
		);
	}

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="Audit Logs"
				icon={<FileText className="h-4 w-4 text-[var(--glow-violet)]" />}
				actions={
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleExport("csv")}
							disabled={exporting}
						>
							<FileText className="h-4 w-4 mr-1" />
							CSV
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleExport("json")}
							disabled={exporting}
						>
							<FileJson className="h-4 w-4 mr-1" />
							JSON
						</Button>
						{exporting && <Loader2 className="h-4 w-4 animate-spin" />}
					</div>
				}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-5xl mx-auto">
					<div className="mb-6">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							Audit Logs
						</h1>
						<p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
							Track all changes in your organization
						</p>
					</div>

					<div className="flex flex-wrap gap-3 mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
						<Select
							value={actionFilter}
							onChange={(e) => {
								setActionFilter(e.target.value as AuditAction | "");
								setPage(0);
							}}
							className="w-48"
						>
							<option value="">All Actions</option>
							{Object.entries(ACTION_LABELS).map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</Select>

						<Select
							value={actorFilter}
							onChange={(e) => {
								setActorFilter(e.target.value);
								setPage(0);
							}}
							className="w-48"
						>
							<option value="">All Users</option>
							{members.map((m: Member) => (
								<option key={m.userId} value={m.userId}>
									{m.email}
								</option>
							))}
						</Select>

						<Input
							type="date"
							value={fromDate}
							onChange={(e) => {
								setFromDate(e.target.value);
								setPage(0);
							}}
							className="w-40"
							placeholder="From"
						/>

						<Input
							type="date"
							value={toDate}
							onChange={(e) => {
								setToDate(e.target.value);
								setPage(0);
							}}
							className="w-40"
							placeholder="To"
						/>

						{(actionFilter || actorFilter || fromDate || toDate) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setActionFilter("");
									setActorFilter("");
									setFromDate("");
									setToDate("");
									setPage(0);
								}}
							>
								Clear
							</Button>
						)}
					</div>

					{isLoading ? (
						<div className="space-y-3">
							<AuditLogSkeleton />
							<AuditLogSkeleton />
							<AuditLogSkeleton />
							<AuditLogSkeleton />
							<AuditLogSkeleton />
						</div>
					) : logs.length === 0 ? (
						<div className="text-center py-12">
							<Download className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-4" />
							<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
								No audit logs found
							</h2>
							<p className="text-[var(--text-muted)]">
								{actionFilter || actorFilter || fromDate || toDate
									? "Try adjusting your filters"
									: "Activity will appear here as changes are made"}
							</p>
						</div>
					) : (
						<>
							<div className="space-y-3 mb-6">
								{logs.map((log) => (
									<AuditLogRow key={log.id} log={log} />
								))}
							</div>

							{totalPages > 1 && (
								<div className="flex items-center justify-between">
									<p className="text-sm text-[var(--text-muted)] font-['JetBrains_Mono']">
										Showing {page * limit + 1}-
										{Math.min((page + 1) * limit, total)} of {total}
									</p>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => p - 1)}
											disabled={page === 0}
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<span className="text-sm text-[var(--text-muted)] font-['JetBrains_Mono']">
											{page + 1} / {totalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => p + 1)}
											disabled={page >= totalPages - 1}
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</main>
	);
}
