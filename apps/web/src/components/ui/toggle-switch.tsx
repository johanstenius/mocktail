import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ToggleSwitchProps = {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
	color?: "violet" | "blue" | "emerald";
	"aria-label"?: string;
};

const colorMap = {
	violet: "bg-[var(--glow-violet)]",
	blue: "bg-[var(--glow-blue)]",
	emerald: "bg-[var(--glow-emerald)]",
};

const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>(
	(
		{
			checked,
			onCheckedChange,
			disabled = false,
			className,
			color = "violet",
			"aria-label": ariaLabel,
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={ariaLabel}
				disabled={disabled}
				onClick={() => onCheckedChange(!checked)}
				className={cn(
					"relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glow-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-void)] disabled:cursor-not-allowed disabled:opacity-50",
					checked ? colorMap[color] : "bg-white/10",
					className,
				)}
			>
				<span
					className={cn(
						"inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
						checked ? "translate-x-4.5" : "translate-x-1",
					)}
				/>
			</button>
		);
	},
);
ToggleSwitch.displayName = "ToggleSwitch";

export { ToggleSwitch };
