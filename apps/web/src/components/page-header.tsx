import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = {
	label: string;
	href?: string;
};

type PageHeaderProps = {
	title?: string;
	breadcrumbs?: Breadcrumb[];
	actions?: ReactNode;
	icon?: ReactNode;
};

export function PageHeader({
	title,
	breadcrumbs,
	actions,
	icon,
}: PageHeaderProps) {
	return (
		<header className="h-20 px-8 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(5,5,5,0.3)] backdrop-blur-md">
			<div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-['Inter']">
				{icon && <div className="mr-1">{icon}</div>}

				{breadcrumbs ? (
					breadcrumbs.map((crumb, index) => (
						<div key={crumb.label} className="flex items-center gap-2">
							{index > 0 && <span className="opacity-50">/</span>}
							{crumb.href ? (
								<Link
									href={crumb.href}
									className="hover:text-[var(--text-secondary)] transition-colors"
								>
									{crumb.label}
								</Link>
							) : (
								<span className="text-[var(--text-primary)] font-medium">
									{crumb.label}
								</span>
							)}
						</div>
					))
				) : (
					<span className="text-[var(--text-primary)] font-medium">
						{title}
					</span>
				)}
			</div>
			{actions && <div className="flex items-center gap-4">{actions}</div>}
		</header>
	);
}
