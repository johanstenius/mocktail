import { prisma } from "../repositories/db/prisma";

async function fixOrphanOrgs() {
	console.log("Finding orgs without subscriptions...");

	const orphanOrgs = await prisma.organization.findMany({
		where: { subscription: null },
		select: { id: true, name: true },
	});

	console.log(`Found ${orphanOrgs.length} orphan orgs`);

	for (const org of orphanOrgs) {
		console.log(`Creating subscription for org: ${org.name} (${org.id})`);
		await prisma.subscription.create({
			data: { organizationId: org.id, tier: "free" },
		});
	}

	console.log("Done!");
}

fixOrphanOrgs()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
