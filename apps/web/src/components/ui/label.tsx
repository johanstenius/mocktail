import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = forwardRef<HTMLLabelElement, LabelProps>(
	({ className, ...props }, ref) => {
		return (
			// biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed via props
			<label
				ref={ref}
				className={cn(
					"text-sm font-medium text-[var(--text-muted)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
					className,
				)}
				{...props}
			/>
		);
	},
);
Label.displayName = "Label";

export { Label };
