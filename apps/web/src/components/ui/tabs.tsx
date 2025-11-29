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
				"inline-flex h-10 items-center gap-1 rounded-lg bg-white/5 p-1",
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
				"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
				isSelected
					? "bg-white/10 text-white"
					: "text-[var(--color-text-muted)] hover:text-white",
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
