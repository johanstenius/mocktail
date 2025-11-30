import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AUTH_CONFIG } from "../config/auth";
import * as inviteRepo from "../repositories/invite.repository";
import * as orgMembershipRepo from "../repositories/org-membership.repository";
import * as userRepo from "../repositories/user.repository";
import type {
	InviteInfoResponse,
	InviteResponse,
	MemberResponse,
} from "../schemas/members";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors";
import {
	type OrgRole,
	canChangeRoles,
	canInviteMembers,
	canRemoveMembers,
} from "../utils/permissions";
import * as tokenService from "./token.service";

const INVITE_EXPIRY_DAYS = 7;

export type MemberModel = {
	id: string;
	userId: string;
	email: string;
	role: OrgRole;
	createdAt: Date;
};

export type InviteModel = {
	id: string;
	email: string;
	role: OrgRole;
	expiresAt: Date;
	invitedBy: string;
	createdAt: Date;
};

function toMemberResponse(m: MemberModel): MemberResponse {
	return {
		id: m.id,
		userId: m.userId,
		email: m.email,
		role: m.role,
		createdAt: m.createdAt.toISOString(),
	};
}

function toInviteResponse(i: InviteModel): InviteResponse {
	return {
		id: i.id,
		email: i.email,
		role: i.role,
		expiresAt: i.expiresAt.toISOString(),
		invitedBy: i.invitedBy,
		createdAt: i.createdAt.toISOString(),
	};
}

export async function listMembers(orgId: string): Promise<MemberResponse[]> {
	const memberships = await orgMembershipRepo.findByOrgId(orgId);

	return memberships.map((m) =>
		toMemberResponse({
			id: m.id,
			userId: m.userId,
			email: m.user.email,
			role: m.role,
			createdAt: m.createdAt,
		}),
	);
}

export async function updateMemberRole(
	membershipId: string,
	newRole: OrgRole,
	actorRole: OrgRole,
	actorUserId: string,
	orgId: string,
): Promise<MemberResponse> {
	if (!canChangeRoles(actorRole)) {
		throw forbidden("Only owners can change roles");
	}

	const membership = await orgMembershipRepo.findById(membershipId);

	if (!membership || membership.orgId !== orgId) {
		throw notFound("Member");
	}

	if (membership.userId === actorUserId) {
		throw badRequest("Cannot change your own role");
	}

	if (membership.role === "owner") {
		throw badRequest("Cannot change owner's role");
	}

	if (newRole === "owner") {
		throw badRequest("Cannot promote to owner");
	}

	const updated = await orgMembershipRepo.updateRole(membershipId, newRole);

	return toMemberResponse({
		id: updated.id,
		userId: updated.userId,
		email: updated.user.email,
		role: updated.role,
		createdAt: updated.createdAt,
	});
}

export async function removeMember(
	membershipId: string,
	actorRole: OrgRole,
	actorUserId: string,
	orgId: string,
): Promise<void> {
	const membership = await orgMembershipRepo.findById(membershipId);

	if (!membership || membership.orgId !== orgId) {
		throw notFound("Member");
	}

	if (membership.userId === actorUserId) {
		throw badRequest("Cannot remove yourself");
	}

	if (!canRemoveMembers(actorRole, membership.role)) {
		throw forbidden("Insufficient permissions to remove this member");
	}

	await orgMembershipRepo.deleteById(membershipId);
}

export async function listInvites(orgId: string): Promise<InviteResponse[]> {
	const invites = await inviteRepo.findActiveByOrgId(orgId);
	return invites.map(toInviteResponse);
}

export async function createInvite(
	email: string,
	role: OrgRole,
	actorRole: OrgRole,
	actorUserId: string,
	orgId: string,
): Promise<{ invite: InviteResponse; token: string }> {
	if (!canInviteMembers(actorRole)) {
		throw forbidden("Insufficient permissions to invite members");
	}

	if (role === "owner") {
		throw badRequest("Cannot invite as owner");
	}

	const existingUser = await userRepo.findByEmail(email);
	if (existingUser) {
		const existingMembership = await orgMembershipRepo.findByUserAndOrg(
			existingUser.id,
			orgId,
		);
		if (existingMembership) {
			throw conflict("User is already a member");
		}
	}

	const existingInvite = await inviteRepo.findByEmailAndOrg(email, orgId);
	if (existingInvite) {
		throw conflict("Invite already pending for this email");
	}

	const token = nanoid(32);
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

	const invite = await inviteRepo.create({
		email,
		orgId,
		role,
		token,
		expiresAt,
		invitedBy: actorUserId,
	});

	return {
		invite: toInviteResponse(invite),
		token,
	};
}

export async function revokeInvite(
	inviteId: string,
	actorRole: OrgRole,
	orgId: string,
): Promise<void> {
	if (!canInviteMembers(actorRole)) {
		throw forbidden("Insufficient permissions");
	}

	const invite = await inviteRepo.findById(inviteId);

	if (!invite || invite.orgId !== orgId) {
		throw notFound("Invite");
	}

	await inviteRepo.deleteById(inviteId);
}

export async function getInviteByToken(
	token: string,
): Promise<InviteInfoResponse> {
	const invite = await inviteRepo.findByToken(token);

	if (!invite) {
		throw notFound("Invite");
	}

	if (invite.expiresAt < new Date()) {
		throw badRequest("Invite has expired");
	}

	return {
		email: invite.email,
		orgName: invite.org.name,
		role: invite.role,
		expiresAt: invite.expiresAt.toISOString(),
	};
}

export type AcceptInviteResult = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: {
		id: string;
		email: string;
		orgId: string;
		orgName: string;
		orgSlug: string;
		role: OrgRole;
		emailVerifiedAt: string | null;
	};
	isExistingUser: boolean;
};

export async function acceptInvite(
	token: string,
	password?: string,
	currentUserId?: string,
): Promise<AcceptInviteResult> {
	const invite = await inviteRepo.findByToken(token);

	if (!invite) {
		throw notFound("Invite");
	}

	if (invite.expiresAt < new Date()) {
		await inviteRepo.deleteById(invite.id);
		throw badRequest("Invite has expired");
	}

	const existingUser = await userRepo.findByEmail(invite.email);

	if (existingUser) {
		if (currentUserId && currentUserId !== existingUser.id) {
			throw badRequest("This invite is for a different email address");
		}

		const existingMembership = await orgMembershipRepo.findByUserAndOrg(
			existingUser.id,
			invite.orgId,
		);
		if (existingMembership) {
			await inviteRepo.deleteById(invite.id);
			throw conflict("Already a member of this organization");
		}

		await inviteRepo.acceptForExistingUser(
			invite.id,
			existingUser.id,
			invite.orgId,
			invite.role,
		);

		const tokens = await tokenService.generateTokenPair(
			existingUser.id,
			invite.orgId,
		);

		return {
			...tokens,
			user: {
				id: existingUser.id,
				email: invite.email,
				orgId: invite.orgId,
				orgName: invite.org.name,
				orgSlug: invite.org.slug,
				role: invite.role,
				emailVerifiedAt: existingUser.emailVerifiedAt?.toISOString() ?? null,
			},
			isExistingUser: true,
		};
	}

	if (!password) {
		throw badRequest("Password required for new account");
	}

	if (password.length < AUTH_CONFIG.passwordMinLength) {
		throw badRequest(
			`Password must be at least ${AUTH_CONFIG.passwordMinLength} characters`,
		);
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const result = await inviteRepo.acceptWithNewUser(
		invite.id,
		invite.email,
		passwordHash,
		invite.orgId,
		invite.role,
	);

	const tokens = await tokenService.generateTokenPair(
		result.user.id,
		invite.orgId,
	);

	return {
		...tokens,
		user: {
			id: result.user.id,
			email: invite.email,
			orgId: invite.orgId,
			orgName: invite.org.name,
			orgSlug: invite.org.slug,
			role: invite.role,
			emailVerifiedAt: null,
		},
		isExistingUser: false,
	};
}
