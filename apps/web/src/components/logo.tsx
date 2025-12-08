import { cn } from "@/lib/utils";

type LogoProps = {
	className?: string;
};

export function Logo({ className }: LogoProps) {
	return (
		<span className={cn("text-xl font-semibold tracking-tight text-[var(--text-primary)]", className)}>
			mockspec
		</span>
	);
}
