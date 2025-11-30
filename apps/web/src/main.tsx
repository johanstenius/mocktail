import { AuthProvider } from "@/lib/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { routeTree } from "./routeTree.gen";
import "./globals.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5000,
			refetchOnWindowFocus: false,
		},
	},
});

const router = createRouter({ routeTree, trailingSlash: "never" });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<RouterProvider router={router} />
					<Toaster
						position="bottom-right"
						toastOptions={{
							style: {
								background: "var(--bg-surface)",
								border: "1px solid var(--border-subtle)",
								color: "var(--text-primary)",
								fontFamily: "Inter, sans-serif",
							},
							classNames: {
								success: "!border-emerald-500/30 !bg-emerald-500/5",
								error:
									"!border-[var(--color-error)]/30 !bg-[var(--color-error)]/5 !text-[var(--color-error)]",
								info: "!border-[var(--glow-violet)]/30 !bg-[var(--glow-violet)]/5",
							},
						}}
					/>
				</AuthProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
}
