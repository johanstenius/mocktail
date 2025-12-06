import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

type EmptyStateProps = {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
	};
	className?: string;
};

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	secondaryAction,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center",
				className,
			)}
		>
			{Icon && (
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[#ff8c57]/20 border border-[var(--color-primary)]/20">
					<Icon className="h-8 w-8 text-[var(--color-primary)]" />
				</div>
			)}
			<h3 className="text-lg font-semibold text-white">{title}</h3>
			{description && (
				<p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-sm">
					{description}
				</p>
			)}
			{(action || secondaryAction) && (
				<div className="mt-6 flex items-center gap-3">
					{action && (
						<Button onClick={action.onClick} disabled={action.disabled}>
							{action.label}
						</Button>
					)}
					{secondaryAction && (
						<Button
							variant="secondary"
							onClick={secondaryAction.onClick}
							disabled={secondaryAction.disabled}
						>
							{secondaryAction.label}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
