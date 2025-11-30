import { cn } from "@/lib/utils";
import { createContext, useContext, useState } from "react";

type TabsContextType = {
	value: string;
	onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error("useTabs must be used within a Tabs");
	}
	return context;
}

type TabsProps = {
	defaultValue: string;
	value?: string;
	onValueChange?: (value: string) => void;
	children: React.ReactNode;
	className?: string;
};

function Tabs({
	defaultValue,
	value: controlledValue,
	onValueChange,
	children,
	className,
}: TabsProps) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

	const value = controlledValue ?? uncontrolledValue;
	const setValue = onValueChange ?? setUncontrolledValue;

	return (
		<TabsContext.Provider value={{ value, onValueChange: setValue }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

function TabsList({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-xl bg-[rgba(0,0,0,0.3)] p-1 border border-[var(--border-subtle)]",
				className,
			)}
		>
			{children}
		</div>
	);
}

function TabsTrigger({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const { value: selectedValue, onValueChange } = useTabs();
	const isSelected = selectedValue === value;

	return (
		<button
			type="button"
			onClick={() => onValueChange(value)}
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200",
				isSelected
					? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-[0_0_10px_rgba(0,0,0,0.2)]"
					: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
				className,
			)}
		>
			{children}
		</button>
	);
}

function TabsContent({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const { value: selectedValue } = useTabs();

	if (selectedValue !== value) return null;

	return <div className={cn("mt-4", className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
