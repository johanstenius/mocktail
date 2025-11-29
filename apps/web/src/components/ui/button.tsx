import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-white text-black hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]",
				secondary:
					"bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md",
				ghost:
					"text-[var(--color-text-muted)] hover:text-white hover:bg-white/5",
				destructive:
					"bg-[var(--color-accent-1)]/10 border border-[var(--color-accent-1)]/20 text-[var(--color-accent-1)] hover:bg-[var(--color-accent-1)]/20",
			},
			size: {
				default: "h-10 px-6 py-2",
				sm: "h-8 px-4 text-xs",
				lg: "h-12 px-8 text-base",
				icon: "h-10 w-10 rounded-full",
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
