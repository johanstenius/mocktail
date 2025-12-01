import { getRequestLogs } from "@/lib/api";
import type { RequestLog } from "@/types";
import type { HttpMethod } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MethodBadge } from "./method-badge";
import { StatusBadge } from "./status-badge";
import { Select } from "./ui/select";

type RequestLogTableProps = {
	projectId: string;
};

function LogRow({ log }: { log: RequestLog }) {
	const [expanded, setExpanded] = useState(false);

	function handleToggle() {
		setExpanded(!expanded);
	}

	return (
		<>
			<tr
				tabIndex={0}
				className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
				onClick={handleToggle}
				onKeyDown={(e) => e.key === "Enter" && handleToggle()}
			>
				<td className="px-4 py-3">
					{expanded ? (
						<ChevronDown className="h-4 w-4 text-[var(--color-text-subtle)]" />
					) : (
						<ChevronRight className="h-4 w-4 text-[var(--color-text-subtle)]" />
					)}
				</td>
				<td className="px-4 py-3 text-sm text-[var(--color-text-subtle)]">
					{new Date(log.createdAt).toLocaleTimeString()}
				</td>
				<td className="px-4 py-3">
					<MethodBadge method={log.method as HttpMethod} />
				</td>
				<td className="px-4 py-3 font-mono text-sm">{log.path}</td>
				<td className="px-4 py-3">
					<StatusBadge status={log.status} />
				</td>
				<td className="px-4 py-3 text-sm text-[var(--color-text-muted)] text-right">
					{log.duration}ms
				</td>
			</tr>
			{expanded && (
				<tr className="border-b border-white/5 bg-white/[0.01]">
					<td colSpan={6} className="p-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
									Request Headers
								</h4>
								<pre className="text-xs font-mono bg-black/20 rounded-lg p-3 overflow-auto max-h-40">
									{JSON.stringify(log.requestHeaders, null, 2)}
								</pre>
							</div>
							<div>
								<h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
									Request Body
								</h4>
								<pre className="text-xs font-mono bg-black/20 rounded-lg p-3 overflow-auto max-h-40">
									{log.requestBody || "(empty)"}
								</pre>
							</div>
							<div className="col-span-2">
								<h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
									Response Body
								</h4>
								<pre className="text-xs font-mono bg-black/20 rounded-lg p-3 overflow-auto max-h-40">
									{log.responseBody || "(empty)"}
								</pre>
							</div>
							{log.validationErrors && log.validationErrors.length > 0 && (
								<div className="col-span-2">
									<h4 className="text-xs font-medium text-[var(--status-warning)] uppercase tracking-wider mb-2">
										Validation Errors
									</h4>
									<ul className="bg-[var(--status-warning)]/10 rounded-lg p-3 text-sm space-y-1">
										{log.validationErrors.map((err) => (
											<li
												key={err}
												className="text-[var(--text-secondary)] font-mono text-xs"
											>
												• {err}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

export function RequestLogTable({ projectId }: RequestLogTableProps) {
	const [methodFilter, setMethodFilter] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string>("");

	const { data, isLoading } = useQuery({
		queryKey: [
			"logs",
			projectId,
			{ method: methodFilter, status: statusFilter },
		],
		queryFn: () =>
			getRequestLogs(projectId, {
				limit: 50,
				method: methodFilter || undefined,
				status: statusFilter ? Number(statusFilter) : undefined,
			}),
		refetchInterval: 5000,
	});

	const logs = data?.logs ?? [];

	return (
		<div>
			{/* Filters */}
			<div className="flex gap-3 mb-4">
				<div className="w-32">
					<Select
						value={methodFilter}
						onChange={(e) => setMethodFilter(e.target.value)}
					>
						<option value="">All Methods</option>
						<option value="GET">GET</option>
						<option value="POST">POST</option>
						<option value="PUT">PUT</option>
						<option value="PATCH">PATCH</option>
						<option value="DELETE">DELETE</option>
					</Select>
				</div>
				<div className="w-32">
					<Select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="">All Status</option>
						<option value="200">2xx</option>
						<option value="400">4xx</option>
						<option value="500">5xx</option>
					</Select>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl border border-white/5 overflow-hidden">
				<table className="w-full">
					<thead className="bg-white/[0.02]">
						<tr className="border-b border-white/5">
							<th className="w-10 px-4 py-3" />
							<th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
								Time
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
								Method
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
								Path
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
								Status
							</th>
							<th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
								Duration
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-12 text-center text-[var(--color-text-muted)]"
								>
									Loading...
								</td>
							</tr>
						) : logs.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-12 text-center text-[var(--color-text-muted)]"
								>
									No requests yet. Make some requests to your mock endpoints.
								</td>
							</tr>
						) : (
							logs.map((log) => <LogRow key={log.id} log={log} />)
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
