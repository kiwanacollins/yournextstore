import type { MetadataRoute } from "next";
import { collectionBrowse, getCanonicalUrl, productBrowse } from "@/lib/commerce";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

async function getAllProducts() {
	const products: { slug: string; updatedAt: string | null; images: string[] }[] = [];
	for (let page = 0; page < MAX_PAGES; page++) {
		const result = await productBrowse({
			limit: PAGE_SIZE,
			offset: page * PAGE_SIZE,
		});
		products.push(
			...result.data.map((p) => ({
				slug: p.handle ?? p.id,
				updatedAt: p.updated_at,
				images: (p.images ?? []).map((img) => img.url),
			})),
		);
		if (result.data.length < PAGE_SIZE) break;
	}
	return products;
}

async function getAllCollections() {
	const result = await collectionBrowse({ limit: 200 });
	return result.data.map((c) => ({ slug: c.handle ?? c.id, lastModified: c.created_at }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getCanonicalUrl();
	const now = new Date();

	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
		{ url: `${baseUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
		{ url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
		{ url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
	];

	const [products, collections] = await Promise.all([
		getAllProducts().catch(() => []),
		getAllCollections().catch(() => []),
	]);

	const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
		url: `${baseUrl}/product/${p.slug}`,
		lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
		changeFrequency: "weekly",
		priority: 0.8,
		images: p.images.length > 0 ? p.images : undefined,
	}));

	const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
		url: `${baseUrl}/collection/${c.slug}`,
		lastModified: new Date(c.lastModified),
		changeFrequency: "weekly",
		priority: 0.7,
	}));

	return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}
