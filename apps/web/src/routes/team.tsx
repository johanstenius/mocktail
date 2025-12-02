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
import {
	createInvite,
	getInvites,
	getMembers,
	removeMember,
	revokeInvite,
	updateMemberRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/route-guards";
import type { Invite, Member, OrgRole } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/team")({
	beforeLoad: requireAuth,
	component: TeamPage,
});

function getRoleBadgeVariant(role: OrgRole) {
	switch (role) {
		case "owner":
			return "violet";
		case "admin":
			return "success";
		default:
			return "default";
	}
}

function MemberRow({
	member,
	currentUserId,
	currentRole,
	onRoleChange,
	onRemove,
}: {
	member: Member;
	currentUserId: string;
	currentRole: OrgRole;
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

function InviteRow({
	invite,
	onRevoke,
}: {
	invite: Invite;
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
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<OrgRole>("member");
	const [error, setError] = useState("");
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => createInvite({ email, role }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invites"] });
			onOpenChange(false);
			setEmail("");
			setRole("member");
			setError("");
			toast.success("Invite sent");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
			toast.error(getErrorMessage(err));
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		mutation.mutate();
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
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Send Invite
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function TeamPage() {
	const {
		isAuthenticated,
		emailVerifiedAt,
		isLoading: authLoading,
		user,
	} = useAuth();
	const navigate = useNavigate();
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const queryClient = useQueryClient();

	const isVerified = Boolean(emailVerifiedAt);

	const { data: members = [], isLoading: membersLoading } = useQuery({
		queryKey: ["members"],
		queryFn: getMembers,
		enabled: isAuthenticated && isVerified,
	});

	const { data: invites = [], isLoading: invitesLoading } = useQuery({
		queryKey: ["invites"],
		queryFn: getInvites,
		enabled: isAuthenticated && isVerified,
	});

	const updateRoleMutation = useMutation({
		mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
			updateMemberRole(memberId, role),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
			toast.success("Role updated");
		},
		onError: () => {
			toast.error("Failed to update role");
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: removeMember,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
			toast.success("Member removed");
		},
		onError: () => {
			toast.error("Failed to remove member");
		},
	});

	const revokeInviteMutation = useMutation({
		mutationFn: revokeInvite,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invites"] });
			toast.success("Invite revoked");
		},
		onError: () => {
			toast.error("Failed to revoke invite");
		},
	});

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

	if (!emailVerifiedAt) {
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
						<Button
							onClick={() => setInviteModalOpen(true)}
							className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10"
						>
							<UserPlus className="h-4 w-4 mr-2" />
							Invite Member
						</Button>
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
										onRoleChange={(role) =>
											updateRoleMutation.mutate({ memberId: member.id, role })
										}
										onRemove={() => removeMemberMutation.mutate(member.id)}
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
												onRevoke={() => revokeInviteMutation.mutate(invite.id)}
											/>
										))}
									</div>
								</>
							)}
						</>
					)}
				</div>
			</div>

			<InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
		</main>
	);
}
