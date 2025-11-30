import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { createContext, useContext, useEffect, useRef } from "react";

type SheetContextType = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const SheetContext = createContext<SheetContextType | null>(null);

function useSheet() {
	const context = useContext(SheetContext);
	if (!context) {
		throw new Error("useSheet must be used within a Sheet");
	}
	return context;
}

type SheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
};

function Sheet({ open, onOpenChange, children }: SheetProps) {
	return (
		<SheetContext.Provider value={{ open, onOpenChange }}>
			{children}
		</SheetContext.Provider>
	);
}

function SheetContent({
	children,
	className,
	side = "right",
}: {
	children: React.ReactNode;
	className?: string;
	side?: "left" | "right";
}) {
	const { open, onOpenChange } = useSheet();
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") onOpenChange(false);
		}
		if (open) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "";
		};
	}, [open, onOpenChange]);

	if (!open) return null;

	const sideClasses = {
		right: "right-0 h-full w-full max-w-2xl animate-slide-in-right",
		left: "left-0 h-full w-full max-w-2xl animate-slide-in-left",
	};

	return (
		<div className="fixed inset-0 z-50">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled in useEffect */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
				onClick={() => onOpenChange(false)}
			/>
			<div
				ref={contentRef}
				className={cn(
					"fixed top-0 z-50 flex flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-2xl",
					sideClasses[side],
					className,
				)}
			>
				<button
					type="button"
					onClick={() => onOpenChange(false)}
					className="absolute right-4 top-4 z-10 rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
				>
					<X className="h-5 w-5" />
				</button>
				{children}
			</div>
		</div>
	);
}

function SheetHeader({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex-shrink-0 border-b border-[var(--border-subtle)] px-6 py-4",
				className,
			)}
		>
			{children}
		</div>
	);
}

function SheetTitle({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<h2
			className={cn(
				"text-lg font-semibold text-[var(--text-primary)] font-['Outfit']",
				className,
			)}
		>
			{children}
		</h2>
	);
}

function SheetDescription({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p className={cn("text-sm text-[var(--text-muted)] mt-1", className)}>
			{children}
		</p>
	);
}

function SheetBody({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex-1 overflow-y-auto p-6", className)}>
			{children}
		</div>
	);
}

export {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetBody,
};
