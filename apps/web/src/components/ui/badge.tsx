import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
	"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-['JetBrains_Mono']",
	{
		variants: {
			variant: {
				default:
					"bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] ring-white/10",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/80",
				outline: "text-foreground",
				success:
					"bg-[rgba(16,185,129,0.1)] text-[var(--status-success)] ring-[var(--status-success)]/20",
				violet:
					"bg-[rgba(139,92,246,0.1)] text-[var(--glow-violet)] ring-[var(--glow-violet)]/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
