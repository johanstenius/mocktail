import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-2)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-2)]/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm transition-all",
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
