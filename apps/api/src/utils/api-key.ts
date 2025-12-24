import { nanoid } from "nanoid";

export type ApiKeyTypeValue = "project" | "org";

export function generateApiKey(type: ApiKeyTypeValue): string {
	const prefix = type === "project" ? "ms_proj" : "ms_org";
	return `${prefix}_${nanoid(32)}`;
}

export function parseApiKeyType(key: string): ApiKeyTypeValue | null {
	if (key.startsWith("ms_proj_")) return "project";
	if (key.startsWith("ms_org_")) return "org";
	// legacy formats
	if (key.startsWith("mt_proj_")) return "project";
	if (key.startsWith("mt_org_")) return "org";
	if (key.startsWith("mockspec_")) return "project";
	return null;
}
