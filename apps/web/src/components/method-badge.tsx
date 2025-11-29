import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/types";

const methodStyles: Record<HttpMethod, string> = {
	GET: "bg-[var(--color-method-get)]/10 text-[var(--color-method-get)] border-[var(--color-method-get)]/20",
	POST: "bg-[var(--color-method-post)]/10 text-[var(--color-method-post)] border-[var(--color-method-post)]/20",
	PUT: "bg-[var(--color-method-put)]/10 text-[var(--color-method-put)] border-[var(--color-method-put)]/20",
	PATCH:
		"bg-[var(--color-method-patch)]/10 text-[var(--color-method-patch)] border-[var(--color-method-patch)]/20",
	DELETE:
		"bg-[var(--color-method-delete)]/10 text-[var(--color-method-delete)] border-[var(--color-method-delete)]/20",
};

type MethodBadgeProps = {
	method: HttpMethod;
	className?: string;
};

export function MethodBadge({ method, className }: MethodBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium",
				methodStyles[method],
				className,
			)}
		>
			{method}
		</span>
	);
}
