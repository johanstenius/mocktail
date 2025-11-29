import { cn } from "@/lib/utils";

type StatusBadgeProps = {
	status: number;
	className?: string;
};

function getStatusStyle(status: number): string {
	if (status >= 200 && status < 300) {
		return "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20";
	}
	if (status >= 300 && status < 400) {
		return "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20";
	}
	if (status >= 400 && status < 500) {
		return "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20";
	}
	if (status >= 500) {
		return "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20";
	}
	return "bg-white/5 text-[var(--color-text-muted)] border-white/10";
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium",
				getStatusStyle(status),
				className,
			)}
		>
			{status}
		</span>
	);
}
