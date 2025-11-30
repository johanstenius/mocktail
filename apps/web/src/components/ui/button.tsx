import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glow-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-void)] disabled:pointer-events-none disabled:opacity-50 font-['Inter']",
	{
		variants: {
			variant: {
				default:
					"bg-[var(--glow-violet)] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:bg-[#7c3aed] hover:-translate-y-0.5",
				secondary:
					"bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] backdrop-blur-md hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-highlight)]",
				ghost:
					"text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
				destructive:
					"bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 px-3 text-xs",
				lg: "h-12 px-7 text-base",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
