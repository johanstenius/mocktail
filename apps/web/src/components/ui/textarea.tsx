import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-xl border border-[var(--border-subtle)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--glow-violet)] focus-visible:shadow-[0_0_0_2px_rgba(139,92,246,0.2)] disabled:cursor-not-allowed disabled:opacity-50 font-['Inter']",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
