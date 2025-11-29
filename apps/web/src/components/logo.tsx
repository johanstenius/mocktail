import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type LogoProps = {
	className?: string;
	showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
	return (
		<Link to="/dashboard" className={cn("flex items-center gap-3", className)}>
			<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-1)] to-[var(--color-accent-2)] shadow-[0_0_20px_rgba(255,46,99,0.4)]" />
			{showText && (
				<span className="text-xl font-extrabold tracking-tight uppercase text-white">
					Mocktail
				</span>
			)}
		</Link>
	);
}
