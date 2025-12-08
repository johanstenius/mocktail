"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5000,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<Toaster
				position="top-right"
				toastOptions={{
					style: {
						background: "var(--bg-surface)",
						border: "1px solid var(--border-subtle)",
						color: "var(--text-primary)",
					},
				}}
			/>
		</QueryClientProvider>
	);
}
