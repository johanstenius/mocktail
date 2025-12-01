import { PageHeader } from "@/components/page-header";
import {
	ActivityItemSkeleton,
	GlassStatCardSkeleton,
	Skeleton,
} from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WelcomeModal } from "@/components/welcome-modal";
import {
	getDashboardActivity,
	getDashboardStats,
	getProjects,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { requireAuth } from "@/lib/route-guards";
import type { ActivityItem, DashboardStats, Project } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
	Activity,
	ArrowRight,
	FolderOpen,
	Loader2,
	Plus,
	Route as RouteIcon,
	Users,
	Zap,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: requireAuth,
	component: DashboardPage,
});

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
				<div className="text-3xl font-bold font-['Outfit'] mb-1">{value}</div>
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

function OnboardingChecklistSkeleton() {
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between mb-4">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-4 w-20" />
				</div>
				<Skeleton className="h-1.5 w-full rounded-full mb-6" />
				<div className="space-y-3">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="flex items-center justify-between py-2">
							<div className="flex items-center gap-3">
								<Skeleton className="w-5 h-5 rounded-full" />
								<Skeleton className="h-4 w-40" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
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

function QuickActionsSkeleton() {
	return (
		<Card>
			<CardContent className="p-6">
				<Skeleton className="h-5 w-28 mb-4" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-12 rounded-lg" />
					<Skeleton className="h-12 rounded-lg" />
				</div>
			</CardContent>
		</Card>
	);
}

function OnboardingChecklist({
	stats,
	projects,
}: {
	stats: DashboardStats;
	projects: Project[];
}) {
	const hasProject = stats.projects > 0;
	const hasEndpoint = stats.endpoints > 0;
	const hasRequest = stats.requestsToday > 0 || stats.requestsThisWeek > 0;
	const hasTeam = stats.teamMembers > 1;

	const steps = [
		{
			done: hasProject,
			label: "Create your first project",
			action: hasProject ? undefined : { to: "/projects", label: "Create" },
		},
		{
			done: hasEndpoint,
			label: "Add an endpoint",
			action:
				hasEndpoint || !hasProject
					? undefined
					: { to: `/projects/${projects[0]?.id}`, label: "Add" },
		},
		{
			done: hasRequest,
			label: "Test your mock API",
			action: undefined,
		},
		{
			done: hasTeam,
			label: "Invite a team member",
			action: hasTeam ? undefined : { to: "/team", label: "Invite" },
		},
	];

	const completedCount = steps.filter((s) => s.done).length;
	const progress = (completedCount / steps.length) * 100;

	if (completedCount === steps.length) {
		return null;
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">Quick Start</CardTitle>
					<span className="text-sm text-[var(--text-muted)]">
						{completedCount}/{steps.length} complete
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div className="h-1.5 bg-[var(--bg-surface-active)] rounded-full mb-6 overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-[var(--glow-violet)] to-[var(--glow-blue)] rounded-full transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>

				<div className="space-y-3">
					{steps.map((step) => (
						<div
							key={step.label}
							className={`flex items-center justify-between py-2 ${step.done ? "opacity-50" : ""}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${step.done ? "border-[var(--glow-emerald)] bg-[var(--glow-emerald)]" : "border-[var(--border-highlight)]"}`}
								>
									{step.done && (
										<svg
											className="w-3 h-3 text-white"
											viewBox="0 0 12 12"
											aria-hidden="true"
										>
											<path
												fill="currentColor"
												d="M10.28 2.28L4.5 8.06 1.72 5.28a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l6.5-6.5a.75.75 0 00-1.06-1.06z"
											/>
										</svg>
									)}
								</div>
								<span
									className={
										step.done ? "line-through text-[var(--text-muted)]" : ""
									}
								>
									{step.label}
								</span>
							</div>
							{step.action && !step.done && (
								<Link to={step.action.to}>
									<Button variant="ghost" size="sm">
										{step.action.label}
										<ArrowRight className="w-4 h-4 ml-1" />
									</Button>
								</Link>
							)}
						</div>
					))}
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

function QuickActions() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Quick Actions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-3">
					<Link to="/projects">
						<Button
							variant="ghost"
							className="w-full justify-start h-auto py-3 glass-hover"
						>
							<Plus className="w-4 h-4 mr-2" />
							New Project
						</Button>
					</Link>
					<Link to="/team">
						<Button
							variant="ghost"
							className="w-full justify-start h-auto py-3 glass-hover"
						>
							<Users className="w-4 h-4 mr-2" />
							Invite Team
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

function DashboardPage() {
	const {
		isAuthenticated,
		emailVerifiedAt,
		isLoading: authLoading,
		org,
		hasCompletedOnboarding,
	} = useAuth();
	const navigate = useNavigate();

	const isVerified = Boolean(emailVerifiedAt);

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

	const { data: projects = [] } = useQuery({
		queryKey: ["projects"],
		queryFn: getProjects,
		enabled: isAuthenticated && isVerified,
	});

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

	const isLoading = statsLoading;

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader title="Dashboard" />

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-6xl mx-auto space-y-8">
					<div>
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							Welcome back
						</h1>
						<p className="text-[var(--text-muted)] font-['Inter'] text-sm">
							{org?.name}
						</p>
					</div>

					{isLoading ? (
						<StatsGridSkeleton />
					) : (
						stats && <StatsGrid stats={stats} />
					)}

					<div className="grid lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 space-y-6">
							{isLoading ? (
								<>
									<OnboardingChecklistSkeleton />
									<ActivityFeedSkeleton />
								</>
							) : (
								<>
									{stats && (
										<OnboardingChecklist stats={stats} projects={projects} />
									)}
									<ActivityFeed activity={activity} />
								</>
							)}
						</div>
						<div>{isLoading ? <QuickActionsSkeleton /> : <QuickActions />}</div>
					</div>
				</div>
			</div>
			<WelcomeModal open={!hasCompletedOnboarding} onOpenChange={() => {}} />
		</main>
	);
}
