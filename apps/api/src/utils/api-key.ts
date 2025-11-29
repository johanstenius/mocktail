import { nanoid } from "nanoid";

export function generateApiKey(): string {
	return `mocktail_${nanoid(32)}`;
}
