import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--glow-violet)] focus-visible:shadow-[0_0_0_2px_rgba(139,92,246,0.2)] disabled:cursor-not-allowed disabled:opacity-50 font-['Inter']",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
