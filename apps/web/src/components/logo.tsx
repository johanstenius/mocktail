import { cn } from "@/lib/utils";

type LogoProps = {
	className?: string;
	showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			{showText && (
				<span className="text-2xl font-extrabold font-['Outfit'] bg-gradient-to-r from-[var(--glow-violet)] to-[var(--glow-blue)] bg-clip-text text-transparent">
					Mocktail
				</span>
			)}
		</div>
	);
}
