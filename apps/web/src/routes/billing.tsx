import { TierCardSkeleton, UsageBarSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	cancelSubscription,
	createCheckoutSession,
	getUsage,
	reactivateSubscription,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Tier } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	Check,
	CreditCard,
	Loader2,
	Sparkles,
	Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/billing")({
	component: BillingPage,
});

const TIER_INFO: Record<
	Tier,
	{ name: string; description: string; price: string }
> = {
	free: {
		name: "Free",
		description: "For individuals and small projects",
		price: "$0",
	},
	pro: {
		name: "Pro",
		description: "For growing teams and businesses",
		price: "$29",
	},
	enterprise: {
		name: "Enterprise",
		description: "For large organizations",
		price: "Custom",
	},
};

const TIER_FEATURES: Record<Tier, string[]> = {
	free: [
		"3 projects",
		"30 endpoints total",
		"10,000 requests/month",
		"3 team members",
	],
	pro: [
		"Unlimited projects",
		"Unlimited endpoints",
		"1,000,000 requests/month",
		"Unlimited team members",
		"Priority support",
	],
	enterprise: [
		"Everything in Pro",
		"Unlimited requests",
		"SSO/SAML",
		"Dedicated support",
		"Custom SLA",
	],
};

function UsageBar({
	current,
	limit,
	label,
}: {
	current: number;
	limit: number | null;
	label: string;
}) {
	const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
	const isNearLimit = limit ? percentage >= 80 : false;

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span className="text-[var(--text-secondary)] font-['Inter']">
					{label}
				</span>
				<span className="text-[var(--text-primary)] font-['JetBrains_Mono']">
					{current.toLocaleString()}
					{limit ? ` / ${limit.toLocaleString()}` : " / Unlimited"}
				</span>
			</div>
			<div className="h-2 bg-[var(--bg-surface-active)] rounded-full overflow-hidden">
				<div
					className={`h-full rounded-full transition-all ${
						isNearLimit
							? "bg-[var(--status-warning)]"
							: "bg-gradient-to-r from-[var(--glow-violet)] to-[var(--glow-blue)]"
					}`}
					style={{ width: limit ? `${percentage}%` : "5%" }}
				/>
			</div>
		</div>
	);
}

function TierCard({
	tier,
	isCurrentTier,
	onUpgrade,
	isPending,
}: {
	tier: Tier;
	isCurrentTier: boolean;
	onUpgrade?: () => void;
	isPending?: boolean;
}) {
	const info = TIER_INFO[tier];
	const features = TIER_FEATURES[tier];

	return (
		<div
			className={`p-6 rounded-2xl border transition-all ${
				isCurrentTier
					? "border-[var(--glow-violet)] bg-[rgba(139,92,246,0.05)]"
					: "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-highlight)]"
			}`}
		>
			<div className="flex items-start justify-between mb-4">
				<div>
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-semibold text-[var(--text-primary)] font-['Outfit']">
							{info.name}
						</h3>
						{isCurrentTier && <Badge variant="violet">Current</Badge>}
					</div>
					<p className="text-sm text-[var(--text-muted)] font-['Inter']">
						{info.description}
					</p>
				</div>
				{tier === "pro" && (
					<Sparkles className="h-5 w-5 text-[var(--glow-violet)]" />
				)}
				{tier === "enterprise" && (
					<Zap className="h-5 w-5 text-[var(--glow-pink)]" />
				)}
			</div>

			<div className="mb-6">
				<span className="text-3xl font-bold text-[var(--text-primary)] font-['Outfit']">
					{info.price}
				</span>
				{tier !== "enterprise" && (
					<span className="text-[var(--text-muted)] font-['Inter']">
						/month
					</span>
				)}
			</div>

			<ul className="space-y-2 mb-6">
				{features.map((feature) => (
					<li key={feature} className="flex items-center gap-2 text-sm">
						<Check className="h-4 w-4 text-[var(--status-success)]" />
						<span className="text-[var(--text-secondary)] font-['Inter']">
							{feature}
						</span>
					</li>
				))}
			</ul>

			{!isCurrentTier && tier === "pro" && onUpgrade && (
				<Button
					onClick={onUpgrade}
					disabled={isPending}
					className="w-full bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10"
				>
					{isPending ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<CreditCard className="mr-2 h-4 w-4" />
					)}
					Upgrade to Pro
				</Button>
			)}

			{!isCurrentTier && tier === "enterprise" && (
				<Button variant="outline" className="w-full">
					Contact Sales
				</Button>
			)}
		</div>
	);
}

function BillingPage() {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);

	const { data: usage, isLoading: usageLoading } = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
		enabled: isAuthenticated,
	});

	const upgradeMutation = useMutation({
		mutationFn: createCheckoutSession,
		onSuccess: (data) => {
			window.location.href = data.url;
		},
	});

	const cancelMutation = useMutation({
		mutationFn: cancelSubscription,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
			setShowCancelConfirm(false);
		},
	});

	const reactivateMutation = useMutation({
		mutationFn: reactivateSubscription,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
		},
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

	const isLoading = usageLoading;
	const currentTier = usage?.tier ?? "free";

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<header className="h-20 px-8 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(5,5,5,0.3)] backdrop-blur-md">
				<div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-['Inter']">
					<span className="text-[var(--text-primary)] font-medium">
						Billing
					</span>
				</div>
			</header>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-5xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							Billing & Usage
						</h1>
						<p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
							Manage your subscription and monitor usage
						</p>
					</div>

					{isLoading ? (
						<div className="space-y-8">
							{/* Usage Section Skeleton */}
							<div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
								<div className="h-5 w-28 bg-[var(--bg-surface-active)] rounded animate-pulse mb-6" />
								<div className="grid gap-6">
									<UsageBarSkeleton />
									<UsageBarSkeleton />
									<UsageBarSkeleton />
									<UsageBarSkeleton />
								</div>
							</div>

							{/* Plans Section Skeleton */}
							<div className="h-5 w-12 bg-[var(--bg-surface-active)] rounded animate-pulse mb-4" />
							<div className="grid md:grid-cols-3 gap-6">
								<TierCardSkeleton />
								<TierCardSkeleton />
								<TierCardSkeleton />
							</div>
						</div>
					) : (
						<>
							{usage?.cancelAtPeriodEnd && (
								<div className="mb-6 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[var(--status-error)]/20 flex items-start gap-3">
									<AlertCircle className="h-5 w-5 text-[var(--status-error)] mt-0.5" />
									<div>
										<p className="text-sm font-medium text-[var(--text-primary)] font-['Inter']">
											Subscription cancelling
										</p>
										<p className="text-sm text-[var(--text-muted)] font-['Inter']">
											Your subscription will end on{" "}
											{usage.currentPeriodEnd
												? new Date(usage.currentPeriodEnd).toLocaleDateString()
												: "the end of the billing period"}
											. You can reactivate anytime before then.
										</p>
										<Button
											variant="secondary"
											size="sm"
											className="mt-2"
											onClick={() => reactivateMutation.mutate()}
											disabled={reactivateMutation.isPending}
										>
											{reactivateMutation.isPending && (
												<Loader2 className="mr-2 h-3 w-3 animate-spin" />
											)}
											Reactivate Subscription
										</Button>
									</div>
								</div>
							)}

							<div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] mb-8">
								<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 font-['Outfit']">
									Current Usage
								</h2>
								<div className="grid gap-6">
									{usage && (
										<>
											<UsageBar
												current={usage.projects.current}
												limit={usage.projects.limit}
												label="Projects"
											/>
											<UsageBar
												current={usage.endpoints.current}
												limit={usage.endpoints.limit}
												label="Endpoints"
											/>
											<UsageBar
												current={usage.requests.current}
												limit={usage.requests.limit}
												label="Requests this month"
											/>
											<UsageBar
												current={usage.members.current}
												limit={usage.members.limit}
												label="Team members"
											/>
										</>
									)}
								</div>
							</div>

							<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-['Outfit']">
								Plans
							</h2>
							<div className="grid md:grid-cols-3 gap-6 mb-8">
								<TierCard tier="free" isCurrentTier={currentTier === "free"} />
								<TierCard
									tier="pro"
									isCurrentTier={currentTier === "pro"}
									onUpgrade={() => upgradeMutation.mutate()}
									isPending={upgradeMutation.isPending}
								/>
								<TierCard
									tier="enterprise"
									isCurrentTier={currentTier === "enterprise"}
								/>
							</div>

							{currentTier === "pro" && !usage?.cancelAtPeriodEnd && (
								<div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
									<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 font-['Outfit']">
										Manage Subscription
									</h2>
									<p className="text-sm text-[var(--text-muted)] mb-4 font-['Inter']">
										{usage?.currentPeriodEnd &&
											`Your next billing date is ${new Date(usage.currentPeriodEnd).toLocaleDateString()}.`}
									</p>
									{showCancelConfirm ? (
										<div className="flex items-center gap-3">
											<span className="text-sm text-[var(--text-secondary)] font-['Inter']">
												Are you sure?
											</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowCancelConfirm(false)}
											>
												Keep Subscription
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => cancelMutation.mutate()}
												disabled={cancelMutation.isPending}
											>
												{cancelMutation.isPending && (
													<Loader2 className="mr-2 h-3 w-3 animate-spin" />
												)}
												Cancel Subscription
											</Button>
										</div>
									) : (
										<Button
											variant="secondary"
											onClick={() => setShowCancelConfirm(true)}
										>
											Cancel Subscription
										</Button>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</main>
	);
}
