import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ className, children, ...props }, ref) => {
		return (
			<div className="relative">
				<select
					ref={ref}
					className={cn(
						"flex h-10 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[rgba(0,0,0,0.3)] px-3 py-2 pr-8 text-sm text-[var(--text-primary)] transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--glow-violet)] focus-visible:shadow-[0_0_0_2px_rgba(139,92,246,0.2)] disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				>
					{children}
				</select>
				<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
			</div>
		);
	},
);
Select.displayName = "Select";

export { Select };
