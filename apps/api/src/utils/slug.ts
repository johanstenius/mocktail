import * as orgRepo from "../repositories/organization.repository";

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function ensureUniqueOrgSlug(baseSlug: string): Promise<string> {
	let slug = baseSlug || "org";
	let suffix = 0;
	while (await orgRepo.findBySlug(slug)) {
		suffix++;
		slug = `${baseSlug}-${suffix}`;
	}
	return slug;
}
