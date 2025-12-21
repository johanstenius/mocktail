"use client";

import { PageHeader } from "@/components/page-header";
import {
	ActivityItemSkeleton,
	GlassStatCardSkeleton,
	Skeleton,
} from "@/components/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardActivity, getDashboardStats } from "@/lib/api";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import type { ActivityItem, DashboardStats } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	Activity,
	FolderOpen,
	LayoutDashboard,
	Route as RouteIcon,
	Users,
	Zap,
} from "lucide-react";

function StatCard({
	label,
	value,
	icon: Icon,
	accent,
}: {
	label: string;
	value: number;
	icon: React.ElementType;
	accent?: string;
}) {
	return (
		<Card>
			<CardContent className="p-5">
				<div className="flex items-center justify-between mb-3">
					<div
						className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || "bg-[var(--glow-violet)]/20"}`}
					>
						<Icon className="h-5 w-5 text-[var(--text-secondary)]" />
					</div>
				</div>
				<div className="text-3xl font-bold  mb-1">{value}</div>
				<div className="text-sm text-[var(--text-muted)]">{label}</div>
			</CardContent>
		</Card>
	);
}

function StatsGrid({ stats }: { stats: DashboardStats }) {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard
				label="Projects"
				value={stats.projects}
				icon={FolderOpen}
				accent="bg-[var(--glow-violet)]/20"
			/>
			<StatCard
				label="Endpoints"
				value={stats.endpoints}
				icon={RouteIcon}
				accent="bg-[var(--glow-blue)]/20"
			/>
			<StatCard
				label="Requests Today"
				value={stats.requestsToday}
				icon={Zap}
				accent="bg-[var(--glow-emerald)]/20"
			/>
			<StatCard
				label="Team Members"
				value={stats.teamMembers}
				icon={Users}
				accent="bg-[var(--glow-pink)]/20"
			/>
		</div>
	);
}

function StatsGridSkeleton() {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<GlassStatCardSkeleton />
			<GlassStatCardSkeleton />
			<GlassStatCardSkeleton />
			<GlassStatCardSkeleton />
		</div>
	);
}

function ActivityFeedSkeleton() {
	return (
		<Card>
			<CardContent className="p-6">
				<Skeleton className="h-5 w-32 mb-4" />
				<div className="space-y-1">
					<ActivityItemSkeleton />
					<ActivityItemSkeleton />
					<ActivityItemSkeleton />
					<ActivityItemSkeleton />
					<ActivityItemSkeleton />
				</div>
			</CardContent>
		</Card>
	);
}

function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
	if (activity.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-[var(--text-muted)]">
						<Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p>No activity yet</p>
						<p className="text-sm mt-1">
							Make requests to your mock endpoints to see activity here
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Recent Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{activity.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
						>
							<div className="flex items-center gap-3">
								<div
									className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
										item.method === "GET"
											? "bg-emerald-500/20 text-emerald-400"
											: item.method === "POST"
												? "bg-blue-500/20 text-blue-400"
												: item.method === "PUT"
													? "bg-amber-500/20 text-amber-400"
													: item.method === "DELETE"
														? "bg-red-500/20 text-red-400"
														: "bg-slate-500/20 text-slate-400"
									}`}
								>
									{item.method}
								</div>
								<div>
									<span className="font-mono text-sm">{item.endpointPath}</span>
									<span className="text-[var(--text-muted)] text-sm ml-2">
										{item.projectName}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<span
									className={`text-sm font-mono ${
										item.status && item.status < 300
											? "text-emerald-400"
											: item.status && item.status < 400
												? "text-amber-400"
												: "text-red-400"
									}`}
								>
									{item.status}
								</span>
								<span className="text-xs text-[var(--text-muted)]">
									{formatDistanceToNow(new Date(item.createdAt), {
										addSuffix: true,
									})}
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default function DashboardPage() {
	const { data: session } = useSession();
	const { data: activeOrg } = useActiveOrganization();

	const isAuthenticated = !!session;
	const user = session?.user;
	const isVerified = Boolean(user?.emailVerified);

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: getDashboardStats,
		enabled: isAuthenticated && isVerified,
	});

	const { data: activity = [] } = useQuery({
		queryKey: ["dashboard-activity"],
		queryFn: () => getDashboardActivity(10),
		enabled: isAuthenticated && isVerified,
	});

	const isLoading = statsLoading;

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="Dashboard"
				icon={<LayoutDashboard className="h-4 w-4 text-[var(--glow-violet)]" />}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-6xl mx-auto space-y-8">
					<div>
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent ">
							Welcome back
						</h1>
						<p className="text-[var(--text-muted)]  text-sm">
							{activeOrg?.name}
						</p>
					</div>

					{isLoading ? (
						<StatsGridSkeleton />
					) : (
						stats && <StatsGrid stats={stats} />
					)}

					{isLoading ? (
						<ActivityFeedSkeleton />
					) : (
						<ActivityFeed activity={activity} />
					)}
				</div>
			</div>
		</main>
	);
}
