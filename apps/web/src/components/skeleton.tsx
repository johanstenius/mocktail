import { cn } from "@/lib/utils";

type SkeletonProps = {
	className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
	return (
		<div
			className={cn(
				"bg-[var(--bg-surface-active)] animate-pulse rounded",
				className,
			)}
		/>
	);
}

export function StatCardSkeleton() {
	return (
		<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
			<Skeleton className="h-3 w-20 mb-3" />
			<Skeleton className="h-8 w-16 mb-2" />
			<Skeleton className="h-3 w-24" />
		</div>
	);
}

export function GlassStatCardSkeleton() {
	return (
		<div className="glass rounded-xl p-5">
			<div className="flex items-center justify-between mb-3">
				<Skeleton className="w-10 h-10 rounded-xl" />
			</div>
			<Skeleton className="h-8 w-12 mb-2" />
			<Skeleton className="h-4 w-20" />
		</div>
	);
}

export function ActivityItemSkeleton() {
	return (
		<div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
			<div className="flex items-center gap-3">
				<Skeleton className="h-5 w-12 rounded" />
				<div>
					<Skeleton className="h-4 w-32 mb-1" />
					<Skeleton className="h-3 w-20" />
				</div>
			</div>
			<div className="flex items-center gap-4">
				<Skeleton className="h-4 w-8" />
				<Skeleton className="h-3 w-16" />
			</div>
		</div>
	);
}

export function ProjectCardSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex items-center gap-4">
			<Skeleton className="h-10 w-10 rounded-xl" />
			<div className="flex-1">
				<Skeleton className="h-5 w-32 mb-1" />
				<Skeleton className="h-4 w-24" />
			</div>
			<div className="hidden sm:block">
				<Skeleton className="h-3 w-16 mb-1" />
				<Skeleton className="h-4 w-8" />
			</div>
		</div>
	);
}

export function MemberRowSkeleton() {
	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
			<div className="flex items-center gap-4">
				<Skeleton className="w-10 h-10 rounded-full" />
				<div>
					<Skeleton className="h-4 w-40 mb-1" />
					<Skeleton className="h-3 w-24" />
				</div>
			</div>
			<Skeleton className="h-6 w-16 rounded-full" />
		</div>
	);
}

export function ApiKeyRowSkeleton() {
	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
			<div className="flex items-center gap-4">
				<Skeleton className="w-10 h-10 rounded-full" />
				<div>
					<Skeleton className="h-4 w-32 mb-1" />
					<Skeleton className="h-3 w-48" />
				</div>
			</div>
			<Skeleton className="h-3 w-20" />
		</div>
	);
}

export function EndpointRowSkeleton() {
	return (
		<div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
			<div className="flex items-center gap-6">
				<Skeleton className="h-5 w-10 rounded-full" />
				<div>
					<Skeleton className="h-5 w-32 mb-1" />
					<Skeleton className="h-3 w-20" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
		</div>
	);
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
	return (
		<tr className="border-b border-[var(--border-subtle)]">
			{Array.from({ length: columns }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton columns
				<td key={i} className="px-4 py-3">
					<Skeleton className="h-4 w-full max-w-[120px]" />
				</td>
			))}
		</tr>
	);
}

export function UsageBarSkeleton() {
	return (
		<div className="space-y-2">
			<div className="flex justify-between">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-4 w-24" />
			</div>
			<Skeleton className="h-2 w-full rounded-full" />
		</div>
	);
}

export function TierCardSkeleton() {
	return (
		<div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
			<div className="mb-4">
				<Skeleton className="h-5 w-16 mb-2" />
				<Skeleton className="h-3 w-32" />
			</div>
			<Skeleton className="h-8 w-12 mb-6" />
			<div className="space-y-2 mb-6">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="flex items-center gap-2">
						<Skeleton className="h-4 w-4 rounded-full" />
						<Skeleton className="h-3 w-28" />
					</div>
				))}
			</div>
		</div>
	);
}

export function ProjectStatBarSkeleton() {
	return (
		<div className="mb-4 last:mb-0">
			<div className="flex justify-between mb-1">
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-16" />
				</div>
				<Skeleton className="h-4 w-12" />
			</div>
			<Skeleton className="h-2 w-full rounded-full" />
		</div>
	);
}
