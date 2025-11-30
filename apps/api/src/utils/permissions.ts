export type OrgRole = "owner" | "admin" | "member";

const ROLE_HIERARCHY: Record<OrgRole, number> = {
	owner: 3,
	admin: 2,
	member: 1,
};

export function isAtLeast(role: OrgRole, minRole: OrgRole): boolean {
	return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

export function canManageApiKeys(role: OrgRole): boolean {
	return isAtLeast(role, "admin");
}

export function canInviteMembers(role: OrgRole): boolean {
	return isAtLeast(role, "admin");
}

export function canManageProjects(role: OrgRole): boolean {
	return isAtLeast(role, "admin");
}

export function canChangeRoles(role: OrgRole): boolean {
	return role === "owner";
}

export function canRemoveMembers(
	actorRole: OrgRole,
	targetRole: OrgRole,
): boolean {
	if (actorRole === "owner") {
		return targetRole !== "owner";
	}
	if (actorRole === "admin") {
		return targetRole === "member";
	}
	return false;
}
