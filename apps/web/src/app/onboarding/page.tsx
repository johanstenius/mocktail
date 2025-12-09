"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	organization,
	useListOrganizations,
	useSession,
} from "@/lib/auth-client";
import { Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

export default function OnboardingPage() {
	const { data: session, isPending: authLoading } = useSession();
	const { data: organizations, isPending: orgsLoading } =
		useListOrganizations();
	const router = useRouter();

	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [creating, setCreating] = useState(false);

	const isAuthenticated = !!session;
	const user = session?.user;
	const orgList = organizations ?? [];

	useEffect(() => {
		if (!authLoading && !orgsLoading) {
			if (!isAuthenticated) {
				router.push("/login");
			} else if (orgList.length > 0) {
				router.push("/dashboard");
			}
		}
	}, [authLoading, orgsLoading, isAuthenticated, orgList.length, router]);

	if (authLoading || orgsLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!isAuthenticated || orgList.length > 0) {
		return null;
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");

		if (!name.trim()) {
			setError("Organization name is required");
			return;
		}

		setCreating(true);
		try {
			const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
			const result = await organization.create({ name: name.trim(), slug });
			if (result.data?.id) {
				await organization.setActive({ organizationId: result.data.id });
			}
			router.push("/dashboard");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create organization",
			);
		} finally {
			setCreating(false);
		}
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<Link href="/">
					<Logo />
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8">
						<div className="text-center mb-8">
							<div className="w-16 h-16 rounded-full bg-[var(--glow-violet)]/10 flex items-center justify-center mx-auto mb-6">
								<Building2 className="w-8 h-8 text-[var(--glow-violet)]" />
							</div>
							<h1 className="text-2xl font-bold mb-2 ">
								Create your organization
							</h1>
							<p className="text-[var(--text-secondary)]">
								Welcome, {user?.email}! Set up your workspace to get started.
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							{error && (
								<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
									{error}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="name">Organization name</Label>
								<Input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Acme Inc"
									required
									autoFocus
								/>
							</div>

							<Button type="submit" disabled={creating} className="w-full">
								{creating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Organization"
								)}
							</Button>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
}
