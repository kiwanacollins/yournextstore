import { collectionBrowse, getCanonicalUrl, getStoreSeo, productBrowse } from "@/lib/commerce";

const FEATURED_PRODUCTS = 30;
const FEATURED_COLLECTIONS = 15;

export async function GET() {
	const baseUrl = getCanonicalUrl();
	const { storeName, storeDescription } = await getStoreSeo();

	const [products, collections] = await Promise.all([
		productBrowse({ limit: FEATURED_PRODUCTS, order: "-created_at" }).catch(() => ({ data: [] })),
		collectionBrowse({ limit: FEATURED_COLLECTIONS }).catch(() => ({ data: [] })),
	]);

	const sections: string[] = [];

	sections.push(`# ${storeName}`);
	sections.push("");
	sections.push(`> ${storeDescription ?? "An e-commerce store."}`);
	sections.push("");
	sections.push(
		`This is the AI-discovery index for ${storeName}. It lists the store's most relevant pages and products to help LLMs and AI search engines understand and cite the catalog.`,
	);
	sections.push("");

	sections.push("## Main pages");
	sections.push("");
	sections.push(`- [Home](${baseUrl}/): ${storeName} home page.`);
	sections.push(`- [All Products](${baseUrl}/products): Browse the complete product catalog.`);
	sections.push(`- [About Us](${baseUrl}/about): Our story, values, and the people behind ${storeName}.`);
	sections.push(`- [FAQ](${baseUrl}/faq): Frequently asked questions about orders, shipping, and returns.`);
	sections.push("");

	if (collections.data.length > 0) {
		sections.push("## Collections");
		sections.push("");
		for (const c of collections.data) {
			sections.push(`- [${c.title}](${baseUrl}/collection/${c.handle}): ${c.title} collection.`);
		}
		sections.push("");
	}

	if (products.data.length > 0) {
		sections.push("## Featured products");
		sections.push("");
		for (const p of products.data) {
			const summary = p.description?.trim() || `${p.title} — available at ${storeName}.`;
			sections.push(`- [${p.title}](${baseUrl}/product/${p.handle}): ${summary}`);
		}
		sections.push("");
	}

	const body = sections.join("\n");

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
		},
	});
}
