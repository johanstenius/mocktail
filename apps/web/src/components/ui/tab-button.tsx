import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TabButtonProps<T extends string> = {
	value: T;
	activeValue: T;
	onClick: (value: T) => void;
	children: ReactNode;
	className?: string;
};

function TabButton<T extends string>({
	value,
	activeValue,
	onClick,
	children,
	className,
}: TabButtonProps<T>) {
	const isActive = value === activeValue;

	return (
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			onClick={() => onClick(value)}
			className={cn(
				"px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glow-violet)]",
				isActive
					? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-[0_0_10px_rgba(0,0,0,0.2)]"
					: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
				className,
			)}
		>
			{children}
		</button>
	);
}

type TabListProps = {
	children: ReactNode;
	className?: string;
};

function TabList({ children, className }: TabListProps) {
	return (
		<div
			role="tablist"
			className={cn(
				"flex items-center gap-1 bg-[rgba(0,0,0,0.3)] p-1 rounded-xl",
				className,
			)}
		>
			{children}
		</div>
	);
}

export { TabButton, TabList };
