"use client";

import { Sidebar } from "@/components/sidebar";
import {
	organization,
	useActiveOrganization,
	useListOrganizations,
	useSession,
} from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

function Background() {
	return (
		<div className="glow-bg">
			<div className="orb orb-1" />
			<div className="orb orb-2" />
			<div className="orb orb-3" />
		</div>
	);
}

export default function AppLayout({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { data: session, isPending: authLoading } = useSession();
	const { data: organizations, isPending: orgsLoading } =
		useListOrganizations();
	const { data: activeOrg, isPending: activeOrgLoading } =
		useActiveOrganization();

	const user = session?.user;
	const orgList = organizations ?? [];

	useEffect(() => {
		if (!orgsLoading && !activeOrgLoading && orgList.length > 0 && !activeOrg) {
			organization.setActive({ organizationId: orgList[0].id });
		}
	}, [orgsLoading, activeOrgLoading, orgList, activeOrg]);

	if (authLoading || orgsLoading || activeOrgLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!session) {
		router.push("/login");
		return null;
	}

	if (user && !user.emailVerified) {
		router.push("/check-email");
		return null;
	}

	if (user?.emailVerified && orgList.length === 0) {
		router.push("/onboarding");
		return null;
	}

	if (orgList.length > 0 && !activeOrg) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	return (
		<>
			<Background />
			<div className="flex h-screen overflow-hidden">
				<Sidebar />
				{children}
			</div>
		</>
	);
}
