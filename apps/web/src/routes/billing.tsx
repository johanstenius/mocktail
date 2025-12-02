import { PageHeader } from "@/components/page-header";
import { TierCardSkeleton, UsageBarSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	cancelSubscription,
	createCheckoutSession,
	getUsage,
	reactivateSubscription,
	retryPayment,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { requireAuth, requireBilling } from "@/lib/route-guards";
import type { Tier } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import {
	AlertCircle,
	AlertTriangle,
	Check,
	CreditCard,
	Loader2,
	RefreshCw,
	Sparkles,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({
	beforeLoad: () => {
		requireBilling();
		requireAuth();
	},
	component: BillingPage,
	validateSearch: (search: Record<string, unknown>) => {
		const result: { success?: boolean; canceled?: boolean } = {};
		if (search.success === "true") result.success = true;
		if (search.canceled === "true") result.canceled = true;
		return result;
	},
});

const TIER_INFO: Record<
	Tier,
	{ name: string; description: string; price: string }
> = {
	free: {
		name: "Free",
		description: "Try it out, no credit card required",
		price: "$0",
	},
	pro: {
		name: "Pro",
		description: "For teams shipping to production",
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
		"10 endpoints per project",
		"5,000 requests/month",
		"3 team members",
		"3 day log retention",
	],
	pro: [
		"10 projects",
		"50 endpoints per project",
		"100,000 requests/month",
		"10 team members",
		"30 day log retention",
	],
	enterprise: [
		"Unlimited projects",
		"Unlimited endpoints",
		"Unlimited requests",
		"Unlimited team members",
		"90 day log retention",
		"SSO/SAML",
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
	const percentage =
		limit !== null ? Math.min((current / limit) * 100, 100) : 0;
	const isNearLimit = limit !== null ? percentage >= 80 : false;

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span className="text-[var(--text-secondary)] font-['Inter']">
					{label}
				</span>
				<span className="text-[var(--text-primary)] font-['JetBrains_Mono']">
					{current.toLocaleString()}
					{limit !== null ? ` / ${limit.toLocaleString()}` : " / Unlimited"}
				</span>
			</div>
			<div className="h-2 bg-[var(--bg-surface-active)] rounded-full overflow-hidden">
				<div
					className={`h-full rounded-full transition-all ${
						isNearLimit
							? "bg-[var(--status-warning)]"
							: "bg-gradient-to-r from-[var(--glow-violet)] to-[var(--glow-blue)]"
					}`}
					style={{ width: limit !== null ? `${percentage}%` : "5%" }}
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

type PaymentModalState = "processing" | "success" | "timeout" | null;

function PaymentProcessingModal({
	state,
	onClose,
}: {
	state: PaymentModalState;
	onClose: () => void;
}) {
	if (!state) return null;

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md bg-[var(--bg-surface)] border-[var(--border-subtle)]">
				<DialogHeader>
					<DialogTitle className="font-['Outfit']">
						{state === "processing" && "Processing payment..."}
						{state === "success" && "Welcome to Pro!"}
						{state === "timeout" && "Payment received"}
					</DialogTitle>
					<DialogDescription className="font-['Inter']">
						{state === "processing" && "Activating your Pro plan..."}
						{state === "success" && "Your new limits are now active."}
						{state === "timeout" &&
							"Your upgrade is being processed. Refresh if your plan doesn't update shortly."}
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-center py-8">
					{state === "processing" && (
						<Loader2 className="w-12 h-12 animate-spin text-[var(--glow-violet)]" />
					)}
					{state === "success" && (
						<div className="w-12 h-12 rounded-full bg-[rgba(16,185,129,0.2)] flex items-center justify-center ring-1 ring-[var(--status-success)]/50">
							<Check className="w-6 h-6 text-[var(--status-success)]" />
						</div>
					)}
					{state === "timeout" && (
						<div className="w-12 h-12 rounded-full bg-[rgba(245,158,11,0.2)] flex items-center justify-center ring-1 ring-[var(--status-warning)]/50">
							<AlertCircle className="w-6 h-6 text-[var(--status-warning)]" />
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function BillingPage() {
	const {
		isAuthenticated,
		emailVerifiedAt,
		isLoading: authLoading,
	} = useAuth();
	const navigate = useNavigate();
	const { success, canceled } = useSearch({ from: "/billing" });
	const queryClient = useQueryClient();
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const [modalState, setModalState] = useState<PaymentModalState>(null);

	const isVerified = Boolean(emailVerifiedAt);

	const {
		data: usage,
		isLoading: usageLoading,
		refetch,
	} = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
		enabled: isAuthenticated && isVerified,
	});

	// Poll for tier upgrade when returning from successful payment
	useEffect(() => {
		if (!success || !usage) return;

		// Already upgraded - show success briefly
		if (usage.tier === "pro" || usage.tier === "enterprise") {
			setModalState("success");
			const timer = setTimeout(() => {
				setModalState(null);
				navigate({ to: "/billing", search: {} });
			}, 2000);
			return () => clearTimeout(timer);
		}

		// Poll for upgrade
		setModalState("processing");
		const startTime = Date.now();
		const maxWaitTime = 15000;

		const interval = setInterval(async () => {
			const result = await refetch();

			if (result.data?.tier === "pro" || result.data?.tier === "enterprise") {
				setModalState("success");
				clearInterval(interval);
				setTimeout(() => {
					setModalState(null);
					navigate({ to: "/billing", search: {} });
				}, 2000);
			} else if (Date.now() - startTime > maxWaitTime) {
				setModalState("timeout");
				clearInterval(interval);
			}
		}, 2000);

		return () => clearInterval(interval);
	}, [success, usage, refetch, navigate]);

	const upgradeMutation = useMutation({
		mutationFn: createCheckoutSession,
		onSuccess: (data) => {
			// Validate redirect URL is from trusted Stripe domain
			try {
				const url = new URL(data.url);
				if (url.hostname.endsWith("stripe.com")) {
					window.location.href = data.url;
				} else {
					toast.error("Invalid checkout URL");
				}
			} catch {
				toast.error("Invalid checkout URL");
			}
		},
		onError: () => {
			toast.error("Failed to start checkout");
		},
	});

	const cancelMutation = useMutation({
		mutationFn: cancelSubscription,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
			setShowCancelConfirm(false);
			toast.success("Subscription cancelled");
		},
		onError: () => {
			toast.error("Failed to cancel subscription");
		},
	});

	const reactivateMutation = useMutation({
		mutationFn: reactivateSubscription,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
			toast.success("Subscription reactivated");
		},
		onError: () => {
			toast.error("Failed to reactivate subscription");
		},
	});

	const retryPaymentMutation = useMutation({
		mutationFn: retryPayment,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
			toast.success("Payment successful!");
		},
		onError: () => {
			toast.error("Payment failed. Please update your payment method.");
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

	if (!emailVerifiedAt) {
		navigate({ to: "/check-email" });
		return null;
	}

	const isLoading = usageLoading;
	const currentTier = usage?.tier ?? "free";

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PaymentProcessingModal
				state={modalState}
				onClose={() => {
					setModalState(null);
					navigate({ to: "/billing", search: {} });
				}}
			/>

			<PageHeader title="Billing" />

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

							{canceled && (
								<div className="mb-6 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] font-['Inter']">
									Checkout was canceled. You can upgrade anytime.
								</div>
							)}

							{usage?.paymentFailedAt && (
								<div className="mb-6 p-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[var(--status-warning)]/30 flex items-start gap-3">
									<AlertTriangle className="h-5 w-5 text-[var(--status-warning)] mt-0.5" />
									<div className="flex-1">
										<p className="text-sm font-medium text-[var(--text-primary)] font-['Inter']">
											Payment failed
										</p>
										<p className="text-sm text-[var(--text-muted)] font-['Inter']">
											{(() => {
												const failedDate = new Date(usage.paymentFailedAt);
												const now = new Date();
												const daysPassed = Math.floor(
													(now.getTime() - failedDate.getTime()) /
														(1000 * 60 * 60 * 24),
												);
												const daysRemaining = Math.max(0, 7 - daysPassed);
												return daysRemaining > 0
													? `You have ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to update your payment method before your account is downgraded to Free.`
													: "Your account will be downgraded soon. Please update your payment method.";
											})()}
										</p>
										<Button
											variant="secondary"
											size="sm"
											className="mt-2"
											onClick={() => retryPaymentMutation.mutate()}
											disabled={retryPaymentMutation.isPending}
										>
											{retryPaymentMutation.isPending ? (
												<Loader2 className="mr-2 h-3 w-3 animate-spin" />
											) : (
												<RefreshCw className="mr-2 h-3 w-3" />
											)}
											Retry Payment
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
