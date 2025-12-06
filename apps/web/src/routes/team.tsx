import { PageHeader } from "@/components/page-header";
import { MemberRowSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getUsage } from "@/lib/api";
import {
	organization,
	useActiveOrganization,
	useSession,
} from "@/lib/auth-client";
import { requireAuth } from "@/lib/route-guards";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	Loader2,
	Mail,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/team")({
	beforeLoad: requireAuth,
	component: TeamPage,
});

type OrgRole = "owner" | "admin" | "member";

function getRoleBadgeVariant(role: string) {
	switch (role) {
		case "owner":
			return "violet";
		case "admin":
			return "success";
		default:
			return "default";
	}
}

type MemberData = {
	id: string;
	userId: string;
	email: string;
	role: string;
	createdAt: string;
};

function MemberRow({
	member,
	currentUserId,
	currentRole,
	onRoleChange,
	onRemove,
}: {
	member: MemberData;
	currentUserId: string;
	currentRole: string;
	onRoleChange: (role: OrgRole) => void;
	onRemove: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const isCurrentUser = member.userId === currentUserId;
	const canModify =
		!isCurrentUser &&
		member.role !== "owner" &&
		(currentRole === "owner" || currentRole === "admin");

	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-highlight)] transition-all">
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--glow-pink)] to-[var(--glow-violet)] flex items-center justify-center text-sm font-bold text-white">
					{member.email.charAt(0).toUpperCase()}
				</div>
				<div>
					<div className="text-sm font-medium text-[var(--text-primary)] font-['Inter']">
						{member.email}
						{isCurrentUser && (
							<span className="ml-2 text-xs text-[var(--text-muted)]">
								(you)
							</span>
						)}
					</div>
					<div className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono']">
						Joined {new Date(member.createdAt).toLocaleDateString()}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				{canModify ? (
					<Select
						value={member.role}
						onChange={(e) => onRoleChange(e.target.value as OrgRole)}
						className="w-28"
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
					</Select>
				) : (
					<Badge variant={getRoleBadgeVariant(member.role)}>
						{member.role}
					</Badge>
				)}
				{canModify &&
					(showConfirm ? (
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowConfirm(false)}
							>
								Cancel
							</Button>
							<Button variant="destructive" size="sm" onClick={onRemove}>
								Remove
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--status-error)]"
							onClick={() => setShowConfirm(true)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					))}
			</div>
		</div>
	);
}

type InviteData = {
	id: string;
	email: string;
	role: string;
	expiresAt: string;
};

function InviteRow({
	invite,
	onRevoke,
}: {
	invite: InviteData;
	onRevoke: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const isExpired = new Date(invite.expiresAt) < new Date();

	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl opacity-70">
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 rounded-full bg-[var(--bg-surface-active)] flex items-center justify-center">
					<Mail className="h-4 w-4 text-[var(--text-muted)]" />
				</div>
				<div>
					<div className="text-sm font-medium text-[var(--text-primary)] font-['Inter']">
						{invite.email}
					</div>
					<div className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono']">
						{isExpired
							? "Expired"
							: `Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<Badge variant={getRoleBadgeVariant(invite.role)}>{invite.role}</Badge>
				<Badge variant={isExpired ? "destructive" : "default"}>
					{isExpired ? "Expired" : "Pending"}
				</Badge>
				{showConfirm ? (
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowConfirm(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" size="sm" onClick={onRevoke}>
							Revoke
						</Button>
					</div>
				) : (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--status-error)]"
						onClick={() => setShowConfirm(true)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

function InviteModal({
	open,
	onOpenChange,
	orgId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orgId: string | null;
}) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<OrgRole>("member");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!orgId) return;
		setError("");
		setIsLoading(true);
		try {
			await organization.inviteMember({ organizationId: orgId, email, role });
			queryClient.invalidateQueries({ queryKey: ["org-invites", orgId] });
			onOpenChange(false);
			setEmail("");
			setRole("member");
			toast.success("Invite sent");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to send invite";
			setError(message);
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite Team Member</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="colleague@company.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">Role</Label>
						<Select
							id="role"
							value={role}
							onChange={(e) => setRole(e.target.value as OrgRole)}
						>
							<option value="member">Member</option>
							<option value="admin">Admin</option>
						</Select>
					</div>
					{error && (
						<p className="text-sm text-[var(--status-error)]">{error}</p>
					)}
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Send Invite
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function TeamPage() {
	const { data: session, isPending: authLoading } = useSession();
	const { data: activeOrg } = useActiveOrganization();
	const navigate = useNavigate();
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const queryClient = useQueryClient();

	const isAuthenticated = !!session;
	const user = session?.user;
	const orgId = activeOrg?.id ?? null;
	const isVerified = Boolean(user?.emailVerified);

	const { data: membersResult, isLoading: membersLoading } = useQuery({
		queryKey: ["org-members", orgId],
		queryFn: async () => {
			if (!orgId) return null;
			const result = await organization.listMembers({
				query: { organizationId: orgId },
			});
			return result.data;
		},
		enabled: !!orgId,
	});

	const { data: invitesResult, isLoading: invitesLoading } = useQuery({
		queryKey: ["org-invites", orgId],
		queryFn: async () => {
			if (!orgId) return null;
			const result = await organization.listInvitations({
				query: { organizationId: orgId },
			});
			return result.data;
		},
		enabled: !!orgId,
	});

	const { data: usage } = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
		enabled: isAuthenticated && isVerified,
	});

	const memberLimitReached =
		usage?.members.limit !== null &&
		usage?.members.current !== undefined &&
		usage.members.current >= usage.members.limit;

	const membersData = membersResult?.members;

	const members: MemberData[] = (membersData ?? []).map((m) => ({
		id: m.id,
		userId: m.userId,
		email: m.user?.email ?? "",
		role: m.role,
		createdAt:
			m.createdAt instanceof Date
				? m.createdAt.toISOString()
				: String(m.createdAt),
	}));

	const invites: InviteData[] = (invitesResult ?? []).map((i) => ({
		id: i.id,
		email: i.email,
		role: i.role,
		expiresAt:
			i.expiresAt instanceof Date
				? i.expiresAt.toISOString()
				: String(i.expiresAt),
	}));

	async function handleUpdateRole(memberId: string, role: OrgRole) {
		if (!orgId) return;
		try {
			await organization.updateMemberRole({
				organizationId: orgId,
				memberId,
				role,
			});
			queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
			toast.success("Role updated");
		} catch {
			toast.error("Failed to update role");
		}
	}

	async function handleRemoveMember(memberId: string) {
		if (!orgId) return;
		try {
			await organization.removeMember({
				organizationId: orgId,
				memberIdOrEmail: memberId,
			});
			queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
			toast.success("Member removed");
		} catch {
			toast.error("Failed to remove member");
		}
	}

	async function handleRevokeInvite(inviteId: string) {
		if (!orgId) return;
		try {
			await organization.cancelInvitation({ invitationId: inviteId });
			queryClient.invalidateQueries({ queryKey: ["org-invites", orgId] });
			toast.success("Invite revoked");
		} catch {
			toast.error("Failed to revoke invite");
		}
	}

	if (authLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!isAuthenticated) {
		navigate({ to: "/login" });
		return null;
	}

	if (!isVerified) {
		navigate({ to: "/check-email" });
		return null;
	}

	const currentMember = members.find((m) => m.userId === user?.id);
	const currentRole = currentMember?.role ?? "member";
	const canInvite = currentRole === "owner" || currentRole === "admin";
	const isLoading = membersLoading || invitesLoading;

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="Team"
				icon={<Users className="h-4 w-4 text-[var(--glow-violet)]" />}
				actions={
					canInvite && (
						<div className="flex items-center gap-3">
							{memberLimitReached && (
								<span className="text-xs text-[var(--status-warning)] flex items-center gap-1">
									<AlertCircle className="h-3 w-3" />
									Member limit reached
								</span>
							)}
							<Button
								onClick={() => setInviteModalOpen(true)}
								disabled={memberLimitReached}
								className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<UserPlus className="h-4 w-4 mr-2" />
								Invite Member
							</Button>
						</div>
					)
				}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-6">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							Team Members
						</h1>
						<p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
							Manage your organization's team
						</p>
					</div>

					{isLoading ? (
						<div className="space-y-3">
							<MemberRowSkeleton />
							<MemberRowSkeleton />
							<MemberRowSkeleton />
						</div>
					) : (
						<>
							<div className="space-y-3 mb-8">
								{members.map((member) => (
									<MemberRow
										key={member.id}
										member={member}
										currentUserId={user?.id ?? ""}
										currentRole={currentRole}
										onRoleChange={(role) => handleUpdateRole(member.id, role)}
										onRemove={() => handleRemoveMember(member.id)}
									/>
								))}
							</div>

							{invites.length > 0 && (
								<>
									<h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-['Outfit']">
										Pending Invites
									</h2>
									<div className="space-y-3">
										{invites.map((invite) => (
											<InviteRow
												key={invite.id}
												invite={invite}
												onRevoke={() => handleRevokeInvite(invite.id)}
											/>
										))}
									</div>
								</>
							)}
						</>
					)}
				</div>
			</div>

			<InviteModal
				open={inviteModalOpen}
				onOpenChange={setInviteModalOpen}
				orgId={orgId}
			/>
		</main>
	);
}
