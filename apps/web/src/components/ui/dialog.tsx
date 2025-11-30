import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { createContext, useContext, useEffect, useRef } from "react";

type DialogContextType = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

function useDialog() {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error("useDialog must be used within a Dialog");
	}
	return context;
}

type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
};

function Dialog({ open, onOpenChange, children }: DialogProps) {
	return (
		<DialogContext.Provider value={{ open, onOpenChange }}>
			{children}
		</DialogContext.Provider>
	);
}

function DialogTrigger({
	children,
	asChild,
}: {
	children: React.ReactNode;
	asChild?: boolean;
}) {
	const { onOpenChange } = useDialog();

	if (asChild) {
		return (
			// biome-ignore lint/a11y/useSemanticElements: span needed for inline children
			<span
				role="button"
				tabIndex={0}
				onClick={() => onOpenChange(true)}
				onKeyDown={(e) => e.key === "Enter" && onOpenChange(true)}
			>
				{children}
			</span>
		);
	}

	return (
		<button type="button" onClick={() => onOpenChange(true)}>
			{children}
		</button>
	);
}

function DialogContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const { open, onOpenChange } = useDialog();
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

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled in useEffect */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm"
				onClick={() => onOpenChange(false)}
			/>
			<div
				ref={contentRef}
				className={cn(
					"relative z-50 w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl p-6 shadow-2xl",
					className,
				)}
			>
				<button
					type="button"
					onClick={() => onOpenChange(false)}
					className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
				>
					<X className="h-4 w-4" />
				</button>
				{children}
			</div>
		</div>
	);
}

function DialogHeader({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={cn("mb-4 space-y-1.5", className)}>{children}</div>;
}

function DialogTitle({
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

function DialogDescription({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p className={cn("text-sm text-[var(--text-secondary)]", className)}>
			{children}
		</p>
	);
}

function DialogFooter({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mt-6 flex justify-end gap-3", className)}>
			{children}
		</div>
	);
}

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
};
