import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "./ui/button";

type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
	value: string;
	label?: string;
};

export function CopyButton({
	value,
	label,
	className,
	children,
	...props
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	async function handleCopy() {
		const success = await copyToClipboard(value);
		if (success) {
			setCopied(true);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => setCopied(false), 1500);
		}
	}

	return (
		<Button
			type="button"
			onClick={handleCopy}
			aria-label={label ?? "Copy to clipboard"}
			className={cn(className)}
			{...props}
		>
			{copied ? (
				<Check className="h-4 w-4 text-[var(--status-success)]" />
			) : (
				<Copy className="h-4 w-4" />
			)}
			{children}
		</Button>
	);
}
