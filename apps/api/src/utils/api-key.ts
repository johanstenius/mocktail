import { nanoid } from "nanoid";

export function generateApiKey(): string {
	return `mockspec_${nanoid(32)}`;
}
