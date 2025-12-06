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
import { useSession } from "@/lib/auth-client";
import { BILLING_ENABLED } from "@/lib/config";
import { requireAuth } from "@/lib/route-guards";
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
	Rocket,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({
	beforeLoad: () => {
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

const FREE_FEATURES = [
	{ text: "2 projects", highlight: false },
	{ text: "5 endpoints per project", highlight: false },
	{ text: "1,000 requests/month", highlight: false },
	{ text: "Solo use only", highlight: false },
	{ text: "1 day log retention", highlight: false },
];

const PRO_FEATURES = [
	{ text: "10 projects", highlight: true },
	{ text: "50 endpoints per project", highlight: true },
	{ text: "100,000 requests/month", highlight: true },
	{ text: "10 team members", highlight: true },
	{ text: "30 day log retention", highlight: false },
	{ text: "Priority support", highlight: false },
];

function UsageRing({
	current,
	limit,
	label,
	icon: Icon,
}: {
	current: number;
	limit: number | null;
	label: string;
	icon: React.ElementType;
}) {
	const percentage =
		limit !== null ? Math.min((current / limit) * 100, 100) : 0;
	const isNearLimit = limit !== null && percentage >= 80;
	const circumference = 2 * Math.PI * 40;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	return (
		<div className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-all group">
			<div className="relative w-20 h-20 flex-shrink-0">
				<svg
					className="w-20 h-20 -rotate-90"
					viewBox="0 0 100 100"
					aria-hidden="true"
				>
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke="rgba(255,255,255,0.05)"
						strokeWidth="8"
					/>
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke={
							isNearLimit ? "var(--status-warning)" : "var(--glow-violet)"
						}
						strokeWidth="8"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						className="transition-all duration-700 ease-out"
						style={{
							filter: isNearLimit
								? "drop-shadow(0 0 8px var(--status-warning))"
								: "drop-shadow(0 0 8px var(--glow-violet))",
						}}
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<Icon
						className={`w-6 h-6 ${isNearLimit ? "text-[var(--status-warning)]" : "text-[var(--glow-violet)]"} transition-colors`}
					/>
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm text-[var(--text-muted)] font-['Inter'] mb-1">
					{label}
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-2xl font-bold text-[var(--text-primary)] font-['Outfit'] tabular-nums">
						{current.toLocaleString()}
					</span>
					<span className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
						/ {limit !== null ? limit.toLocaleString() : "∞"}
					</span>
				</div>
				{isNearLimit && (
					<div className="text-xs text-[var(--status-warning)] mt-1 font-['Inter']">
						{Math.round(percentage)}% used
					</div>
				)}
			</div>
		</div>
	);
}

function ComingSoonPage() {
	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="Billing"
				icon={<CreditCard className="h-4 w-4 text-[var(--glow-violet)]" />}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-4xl mx-auto">
					{/* Hero Section */}
					<div className="relative mb-12">
						<div className="absolute inset-0 bg-gradient-to-r from-[var(--glow-violet)]/10 via-[var(--glow-blue)]/5 to-transparent rounded-3xl blur-xl" />
						<div className="relative p-8 md:p-12 rounded-3xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
							{/* Decorative elements */}
							<div className="absolute top-0 right-0 w-64 h-64 bg-[var(--glow-violet)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
							<div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--glow-blue)]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

							<div className="relative z-10">
								<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--glow-violet)]/10 border border-[var(--glow-violet)]/20 mb-6">
									<Rocket className="w-4 h-4 text-[var(--glow-violet)]" />
									<span className="text-sm font-medium text-[var(--glow-violet)] font-['Inter']">
										Coming Soon
									</span>
								</div>

								<h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Outfit'] leading-tight">
									<span className="bg-gradient-to-r from-white via-white to-[var(--text-secondary)] bg-clip-text text-transparent">
										Pro tier is on
									</span>
									<br />
									<span className="bg-gradient-to-r from-[var(--glow-violet)] to-[var(--glow-blue)] bg-clip-text text-transparent">
										the way
									</span>
								</h1>

								<p className="text-lg text-[var(--text-secondary)] font-['Inter'] max-w-xl mb-8">
									We're putting the finishing touches on our Pro plan. Get ready
									for more projects, more endpoints, and team collaboration.
								</p>

								<div className="flex flex-wrap gap-4">
									<div className="flex items-center gap-2 text-[var(--text-muted)]">
										<div className="w-8 h-8 rounded-lg bg-[var(--glow-violet)]/10 flex items-center justify-center">
											<Zap className="w-4 h-4 text-[var(--glow-violet)]" />
										</div>
										<span className="text-sm font-['Inter']">
											100k requests/mo
										</span>
									</div>
									<div className="flex items-center gap-2 text-[var(--text-muted)]">
										<div className="w-8 h-8 rounded-lg bg-[var(--glow-blue)]/10 flex items-center justify-center">
											<Users className="w-4 h-4 text-[var(--glow-blue)]" />
										</div>
										<span className="text-sm font-['Inter']">
											Team collaboration
										</span>
									</div>
									<div className="flex items-center gap-2 text-[var(--text-muted)]">
										<div className="w-8 h-8 rounded-lg bg-[var(--glow-pink)]/10 flex items-center justify-center">
											<Sparkles className="w-4 h-4 text-[var(--glow-pink)]" />
										</div>
										<span className="text-sm font-['Inter']">
											Priority support
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Comparison Grid */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* Free Tier */}
						<div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
							<div className="flex items-center justify-between mb-6">
								<div>
									<h3 className="text-xl font-semibold text-[var(--text-primary)] font-['Outfit']">
										Free
									</h3>
									<p className="text-sm text-[var(--text-muted)] font-['Inter']">
										What you have now
									</p>
								</div>
								<Badge variant="default">Current</Badge>
							</div>

							<div className="mb-6">
								<span className="text-4xl font-bold text-[var(--text-primary)] font-['Outfit']">
									$0
								</span>
								<span className="text-[var(--text-muted)] font-['Inter']">
									{" "}
									forever
								</span>
							</div>

							<ul className="space-y-3">
								{FREE_FEATURES.map((feature) => (
									<li
										key={feature.text}
										className="flex items-center gap-3 text-sm"
									>
										<div className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center flex-shrink-0">
											<Check className="w-3 h-3 text-[var(--text-muted)]" />
										</div>
										<span className="text-[var(--text-secondary)] font-['Inter']">
											{feature.text}
										</span>
									</li>
								))}
							</ul>
						</div>

						{/* Pro Tier - Coming Soon */}
						<div className="relative p-6 rounded-2xl border border-[var(--glow-violet)]/30 bg-gradient-to-b from-[var(--glow-violet)]/8 to-transparent overflow-hidden">
							{/* Animated shimmer */}
							<div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(139,92,246,0.1)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_3s_infinite]" />

							<div className="relative z-10">
								<div className="flex items-center justify-between mb-6">
									<div>
										<h3 className="text-xl font-semibold text-[var(--text-primary)] font-['Outfit'] flex items-center gap-2">
											Pro
											<Sparkles className="w-5 h-5 text-[var(--glow-violet)]" />
										</h3>
										<p className="text-sm text-[var(--text-muted)] font-['Inter']">
											For teams & production
										</p>
									</div>
									<Badge
										variant="violet"
										className="bg-[var(--glow-violet)]/20 border-[var(--glow-violet)]/30 flex items-center gap-1.5"
									>
										<span className="relative flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--glow-violet)] opacity-75" />
											<span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--glow-violet)]" />
										</span>
										Soon
									</Badge>
								</div>

								<p className="text-[var(--text-secondary)] text-sm mb-6 font-['Inter']">
									Everything in Free, plus:
								</p>

								<ul className="space-y-3 mb-6">
									{[
										{ label: "More projects", icon: "📁" },
										{ label: "More endpoints", icon: "🔗" },
										{ label: "Higher request limits", icon: "⚡" },
										{ label: "Team collaboration", icon: "👥" },
										{ label: "Extended log retention", icon: "📊" },
										{ label: "Priority support", icon: "💬" },
									].map((feature) => (
										<li
											key={feature.label}
											className="flex items-center gap-3 text-sm"
										>
											<span className="text-base">{feature.icon}</span>
											<span className="text-[var(--text-secondary)] font-['Inter']">
												{feature.label}
											</span>
										</li>
									))}
								</ul>

								<div className="w-full py-3 rounded-xl bg-gradient-to-r from-[rgba(139,92,246,0.2)] to-[rgba(59,130,246,0.2)] border border-[rgba(139,92,246,0.3)] text-[var(--text-primary)] font-semibold text-center flex items-center justify-center gap-2 font-['Inter']">
									<Rocket className="w-4 h-4 text-[var(--glow-violet)]" />
									Launching Soon
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
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

function ActiveBillingPage() {
	const navigate = useNavigate();
	const { success, canceled } = useSearch({ from: "/billing" });
	const queryClient = useQueryClient();
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const [modalState, setModalState] = useState<PaymentModalState>(null);

	const {
		data: usage,
		isLoading: usageLoading,
		refetch,
	} = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
	});

	useEffect(() => {
		if (!success || !usage) return;

		if (usage.tier === "pro") {
			setModalState("success");
			const timer = setTimeout(() => {
				setModalState(null);
				navigate({ to: "/billing", search: {} });
			}, 2000);
			return () => clearTimeout(timer);
		}

		setModalState("processing");
		const startTime = Date.now();
		const maxWaitTime = 15000;

		const interval = setInterval(async () => {
			const result = await refetch();

			if (result.data?.tier === "pro") {
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

			<PageHeader
				title="Billing"
				icon={<CreditCard className="h-4 w-4 text-[var(--glow-violet)]" />}
			/>

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

					{usageLoading ? (
						<div className="space-y-8">
							<div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
								<div className="h-5 w-28 bg-[var(--bg-surface-active)] rounded animate-pulse mb-6" />
								<div className="grid gap-6">
									<UsageBarSkeleton />
									<UsageBarSkeleton />
									<UsageBarSkeleton />
									<UsageBarSkeleton />
								</div>
							</div>
							<div className="h-5 w-12 bg-[var(--bg-surface-active)] rounded animate-pulse mb-4" />
							<div className="grid md:grid-cols-2 gap-6 max-w-2xl">
								<TierCardSkeleton />
								<TierCardSkeleton />
							</div>
						</div>
					) : (
						<>
							{/* Alerts */}
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
													? `You have ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to update your payment method.`
													: "Your account will be downgraded soon.";
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

							{/* Usage Section with Ring Charts */}
							<div className="mb-8">
								<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-['Outfit']">
									Current Usage
								</h2>
								<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{usage && (
										<>
											<UsageRing
												current={usage.projects.current}
												limit={usage.projects.limit}
												label="Projects"
												icon={CreditCard}
											/>
											<UsageRing
												current={usage.endpoints.current}
												limit={usage.endpoints.limit}
												label="Endpoints"
												icon={Zap}
											/>
											<UsageRing
												current={usage.requests.current}
												limit={usage.requests.limit}
												label="Requests"
												icon={Sparkles}
											/>
											<UsageRing
												current={usage.members.current}
												limit={usage.members.limit}
												label="Members"
												icon={Users}
											/>
										</>
									)}
								</div>
							</div>

							{/* Plans Comparison */}
							<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-['Outfit']">
								Plans
							</h2>
							<div className="grid md:grid-cols-2 gap-6 mb-8 max-w-3xl">
								{/* Free Tier */}
								<div
									className={`p-6 rounded-2xl border transition-all ${
										currentTier === "free"
											? "border-[var(--glow-violet)]/50 bg-[rgba(139,92,246,0.05)]"
											: "border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]"
									}`}
								>
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-xl font-semibold text-[var(--text-primary)] font-['Outfit']">
											Free
										</h3>
										{currentTier === "free" && (
											<Badge variant="violet">Current</Badge>
										)}
									</div>

									<div className="mb-6">
										<span className="text-4xl font-bold text-[var(--text-primary)] font-['Outfit']">
											$0
										</span>
									</div>

									<ul className="space-y-2">
										{FREE_FEATURES.map((feature) => (
											<li
												key={feature.text}
												className="flex items-center gap-2 text-sm"
											>
												<Check className="h-4 w-4 text-[var(--status-success)]" />
												<span className="text-[var(--text-secondary)] font-['Inter']">
													{feature.text}
												</span>
											</li>
										))}
									</ul>
								</div>

								{/* Pro Tier */}
								<div
									className={`relative p-6 rounded-2xl border transition-all overflow-hidden ${
										currentTier === "pro"
											? "border-[var(--glow-violet)]/50 bg-[rgba(139,92,246,0.05)]"
											: "border-[var(--glow-violet)]/30 bg-gradient-to-b from-[var(--glow-violet)]/5 to-transparent"
									}`}
								>
									{currentTier !== "pro" && (
										<div className="absolute top-0 right-0 w-32 h-32 bg-[var(--glow-violet)]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
									)}

									<div className="relative z-10">
										<div className="flex items-center justify-between mb-4">
											<h3 className="text-xl font-semibold text-[var(--text-primary)] font-['Outfit'] flex items-center gap-2">
												Pro
												<Sparkles className="w-5 h-5 text-[var(--glow-violet)]" />
											</h3>
											{currentTier === "pro" && (
												<Badge variant="violet">Current</Badge>
											)}
										</div>

										<div className="mb-6">
											<span className="text-4xl font-bold text-[var(--text-primary)] font-['Outfit']">
												$29
											</span>
											<span className="text-[var(--text-muted)] font-['Inter']">
												/mo
											</span>
										</div>

										<ul className="space-y-2 mb-6">
											{PRO_FEATURES.map((feature) => (
												<li
													key={feature.text}
													className="flex items-center gap-2 text-sm"
												>
													<Check
														className={`h-4 w-4 ${feature.highlight ? "text-[var(--glow-violet)]" : "text-[var(--status-success)]"}`}
													/>
													<span
														className={`font-['Inter'] ${feature.highlight ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
													>
														{feature.text}
													</span>
												</li>
											))}
										</ul>

										{currentTier !== "pro" && (
											<Button
												onClick={() => upgradeMutation.mutate()}
												disabled={upgradeMutation.isPending}
												className="w-full bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-white/10"
											>
												{upgradeMutation.isPending ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<CreditCard className="mr-2 h-4 w-4" />
												)}
												Upgrade to Pro
											</Button>
										)}
									</div>
								</div>
							</div>

							{/* Manage Subscription */}
							{currentTier === "pro" && !usage?.cancelAtPeriodEnd && (
								<div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
									<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 font-['Outfit']">
										Manage Subscription
									</h2>
									<p className="text-sm text-[var(--text-muted)] mb-4 font-['Inter']">
										{usage?.currentPeriodEnd &&
											`Next billing date: ${new Date(usage.currentPeriodEnd).toLocaleDateString()}`}
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

function BillingPage() {
	const { data: session, isPending: authLoading } = useSession();
	const navigate = useNavigate();

	const isAuthenticated = !!session;
	const user = session?.user;
	const isVerified = Boolean(user?.emailVerified);

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

	if (!isVerified) {
		navigate({ to: "/check-email" });
		return null;
	}

	// Show coming soon page when billing is disabled
	if (!BILLING_ENABLED) {
		return <ComingSoonPage />;
	}

	return <ActiveBillingPage />;
}
