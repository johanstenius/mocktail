/**
 * Migration script: Convert existing endpoint response data to ResponseVariant records
 *
 * Run with: npx tsx scripts/migrate-endpoints-to-variants.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting endpoint to variant migration...");

	const endpoints = await prisma.endpoint.findMany({
		include: { variants: true },
	});

	console.log(`Found ${endpoints.length} endpoints`);

	let migrated = 0;
	let skipped = 0;

	for (const endpoint of endpoints) {
		if (endpoint.variants.length > 0) {
			console.log(
				`  Skipping ${endpoint.method} ${endpoint.path} - already has variants`,
			);
			skipped++;
			continue;
		}

		if (endpoint.status === null) {
			console.log(
				`  Skipping ${endpoint.method} ${endpoint.path} - no legacy data`,
			);
			skipped++;
			continue;
		}

		await prisma.responseVariant.create({
			data: {
				endpointId: endpoint.id,
				name: "Default",
				priority: 0,
				isDefault: true,
				status: endpoint.status ?? 200,
				headers: endpoint.headers ?? "{}",
				body: endpoint.body ?? "{}",
				bodyType: endpoint.bodyType ?? "static",
				delay: endpoint.delay ?? 0,
				failRate: endpoint.failRate ?? 0,
				rules: "[]",
				ruleLogic: "and",
			},
		});

		console.log(`  Migrated ${endpoint.method} ${endpoint.path}`);
		migrated++;
	}

	console.log(`\nMigration complete:`);
	console.log(`  - Migrated: ${migrated}`);
	console.log(`  - Skipped: ${skipped}`);
}

main()
	.catch((e) => {
		console.error("Migration failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
