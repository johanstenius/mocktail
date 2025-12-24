import { faker } from "@faker-js/faker";
import Handlebars from "handlebars";
import { getBucketData } from "./state.service";

export type RequestContext = {
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string>;
	body: unknown;
	projectId?: string;
};

type HandlebarsOptions = {
	hash?: Record<string, unknown>;
};

function registerFakerHelpers(): void {
	// Person
	Handlebars.registerHelper("faker_person_fullName", () =>
		faker.person.fullName(),
	);
	Handlebars.registerHelper("faker_person_firstName", () =>
		faker.person.firstName(),
	);
	Handlebars.registerHelper("faker_person_lastName", () =>
		faker.person.lastName(),
	);

	// Internet
	Handlebars.registerHelper("faker_internet_email", () =>
		faker.internet.email(),
	);
	Handlebars.registerHelper("faker_internet_username", () =>
		faker.internet.username(),
	);
	Handlebars.registerHelper("faker_internet_url", () => faker.internet.url());

	// String
	Handlebars.registerHelper("faker_string_uuid", () => faker.string.uuid());
	Handlebars.registerHelper(
		"faker_string_alphanumeric",
		(length: number | HandlebarsOptions) =>
			faker.string.alphanumeric(typeof length === "number" ? length : 10),
	);

	// Number
	Handlebars.registerHelper(
		"faker_number_int",
		(max: number | HandlebarsOptions) =>
			faker.number.int(typeof max === "number" ? { max } : undefined),
	);
	Handlebars.registerHelper(
		"faker_number_float",
		(max: number | HandlebarsOptions, precision?: number | HandlebarsOptions) =>
			faker.number.float({
				max: typeof max === "number" ? max : undefined,
				fractionDigits: typeof precision === "number" ? precision : 2,
			}),
	);

	// Date
	Handlebars.registerHelper("faker_date_past", () =>
		faker.date.past().toISOString(),
	);
	Handlebars.registerHelper("faker_date_future", () =>
		faker.date.future().toISOString(),
	);
	Handlebars.registerHelper("faker_date_recent", () =>
		faker.date.recent().toISOString(),
	);

	// Lorem
	Handlebars.registerHelper("faker_lorem_sentence", () =>
		faker.lorem.sentence(),
	);
	Handlebars.registerHelper("faker_lorem_paragraph", () =>
		faker.lorem.paragraph(),
	);

	// Image
	Handlebars.registerHelper("faker_image_url", () => faker.image.url());

	// Clean aliases (preferred)
	Handlebars.registerHelper("uuid", () => faker.string.uuid());
	Handlebars.registerHelper("now", () => new Date().toISOString());
	Handlebars.registerHelper("name", () => faker.person.fullName());
	Handlebars.registerHelper("firstName", () => faker.person.firstName());
	Handlebars.registerHelper("lastName", () => faker.person.lastName());
	Handlebars.registerHelper("email", () => faker.internet.email());
	Handlebars.registerHelper("username", () => faker.internet.username());
	Handlebars.registerHelper("url", () => faker.internet.url());
	Handlebars.registerHelper("imageUrl", () => faker.image.url());
	Handlebars.registerHelper("int", (max: number | HandlebarsOptions) =>
		faker.number.int(typeof max === "number" ? { max } : undefined),
	);
	Handlebars.registerHelper(
		"float",
		(max: number | HandlebarsOptions, precision?: number | HandlebarsOptions) =>
			faker.number.float({
				max: typeof max === "number" ? max : undefined,
				fractionDigits: typeof precision === "number" ? precision : 2,
			}),
	);
	Handlebars.registerHelper("sentence", () => faker.lorem.sentence());
	Handlebars.registerHelper("paragraph", () => faker.lorem.paragraph());
	Handlebars.registerHelper("past", () => faker.date.past().toISOString());
	Handlebars.registerHelper("future", () => faker.date.future().toISOString());
	Handlebars.registerHelper("recent", () => faker.date.recent().toISOString());
}

let helpersRegistered = false;
let currentProjectId: string | undefined;

function registerBucketHelpers(): void {
	Handlebars.registerHelper("bucket", (bucketName: string) => {
		if (!currentProjectId) return "[]";
		const data = getBucketData(currentProjectId, bucketName);
		return JSON.stringify(data ?? []);
	});

	Handlebars.registerHelper("bucketLength", (bucketName: string) => {
		if (!currentProjectId) return 0;
		const data = getBucketData(currentProjectId, bucketName);
		return data?.length ?? 0;
	});

	Handlebars.registerHelper(
		"bucketItem",
		(bucketName: string, index: number | HandlebarsOptions) => {
			if (!currentProjectId) return "null";
			const data = getBucketData(currentProjectId, bucketName);
			if (!data || data.length === 0) return "null";

			const idx = typeof index === "number" ? index : 0;
			const actualIndex = idx < 0 ? data.length + idx : idx;

			if (actualIndex < 0 || actualIndex >= data.length) return "null";
			return JSON.stringify(data[actualIndex]);
		},
	);
}

function ensureHelpers(): void {
	if (!helpersRegistered) {
		registerFakerHelpers();
		registerBucketHelpers();
		helpersRegistered = true;
	}
}

export function processTemplate(
	template: string,
	context: RequestContext,
): string {
	ensureHelpers();
	currentProjectId = context.projectId;

	const templateContext = {
		request: {
			params: context.params,
			query: context.query,
			headers: context.headers,
			body: context.body,
		},
	};

	const compiled = Handlebars.compile(template, { noEscape: true });
	const result = compiled(templateContext);
	currentProjectId = undefined;
	return result;
}
