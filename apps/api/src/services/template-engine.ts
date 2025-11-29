import { faker } from "@faker-js/faker";
import Handlebars from "handlebars";

export type RequestContext = {
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string>;
	body: unknown;
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
}

let helpersRegistered = false;

function ensureHelpers(): void {
	if (!helpersRegistered) {
		registerFakerHelpers();
		helpersRegistered = true;
	}
}

export function processTemplate(
	template: string,
	context: RequestContext,
): string {
	ensureHelpers();

	const templateContext = {
		request: {
			params: context.params,
			query: context.query,
			headers: context.headers,
			body: context.body,
		},
	};

	const compiled = Handlebars.compile(template, { noEscape: true });
	return compiled(templateContext);
}
