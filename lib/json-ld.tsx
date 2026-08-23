import { type collectionGet, getCanonicalUrl, getStoreSeo, type productGet } from "@/lib/commerce";
import { CURRENCY } from "@/lib/constants";

type ProductLike = NonNullable<Awaited<ReturnType<typeof productGet>>>;
type CollectionLike = NonNullable<Awaited<ReturnType<typeof collectionGet>>>;

function getBaseUrl(): string {
	return getCanonicalUrl();
}

export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
		/>
	);
}

export function buildProductJsonLd(product: ProductLike): Record<string, unknown> {
	const variants = product.variants ?? [];
	const prices = variants
		.map((v) => v.calculated_price?.calculated_amount)
		.filter((amount): amount is number => typeof amount === "number");
	const lowPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : undefined;
	const highPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : undefined;
	const baseUrl = getBaseUrl();
	const currency = (variants[0]?.calculated_price?.currency_code ?? CURRENCY).toUpperCase();
	const images = (product.images ?? []).map((img) => img.url);
	const firstVariant = variants[0];

	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.title,
		description: product.description,
		image: images,
		sku: firstVariant?.sku ?? product.id,
		brand: product.categories?.[0] ? { "@type": "Brand", name: product.categories[0].name } : undefined,
		offers:
			variants.length === 1
				? {
						"@type": "Offer",
						url: `${baseUrl}/product/${product.handle}`,
						priceCurrency: currency,
						price: lowPrice,
						availability:
							firstVariant?.inventory_quantity === undefined || (firstVariant?.inventory_quantity ?? 0) > 0
								? "https://schema.org/InStock"
								: "https://schema.org/OutOfStock",
					}
				: {
						"@type": "AggregateOffer",
						lowPrice,
						highPrice,
						priceCurrency: currency,
						offerCount: variants.length,
						availability: "https://schema.org/InStock",
					},
	};
}

export function buildProductBreadcrumbJsonLd(product: ProductLike): Record<string, unknown> {
	const baseUrl = getBaseUrl();
	const category = product.categories?.[0];
	const items = [
		{ "@type": "ListItem", position: 1, name: "Home", item: baseUrl || undefined },
		category
			? {
					"@type": "ListItem",
					position: 2,
					name: category.name,
					item: `${baseUrl}/category/${category.handle}`,
				}
			: null,
		{
			"@type": "ListItem",
			position: category ? 3 : 2,
			name: product.title,
		},
	].filter(Boolean);

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items,
	};
}

export function buildCollectionJsonLd(collection: CollectionLike): Record<string, unknown> {
	const baseUrl = getBaseUrl();
	const products = collection.products ?? [];

	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: collection.title,
		description: `${collection.title} collection`,
		numberOfItems: products.length,
		hasPart: products.map((product) => ({
			"@type": "Product",
			name: product.title,
			url: `${baseUrl}/product/${product.handle}`,
			image: product.thumbnail ?? undefined,
		})),
	};
}

export function buildCollectionBreadcrumbJsonLd(collection: CollectionLike): Record<string, unknown> {
	const baseUrl = getBaseUrl();

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Home", item: baseUrl || undefined },
			{ "@type": "ListItem", position: 2, name: collection.title },
		],
	};
}

export function buildCategoryBreadcrumbJsonLd(
	hierarchy: Array<{ name: string; slug: string }>,
): Record<string, unknown> {
	const baseUrl = getBaseUrl();
	let path = "";

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Home", item: baseUrl || undefined },
			...hierarchy.map((category, index) => {
				path += `/${category.slug}`;
				return {
					"@type": "ListItem",
					position: index + 2,
					name: category.name,
					item: baseUrl ? `${baseUrl}/category${path}` : undefined,
				};
			}),
		],
	};
}

export async function StoreJsonLd() {
	const { storeName, storeDescription } = await getStoreSeo();
	const baseUrl = getBaseUrl();

	const organization = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: storeName,
		url: baseUrl,
	};

	const website = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: storeName,
		url: baseUrl,
		description: storeDescription ?? undefined,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${baseUrl}/search?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};

	const store = {
		"@context": "https://schema.org",
		"@type": "Store",
		name: storeName,
		description: storeDescription ?? undefined,
		url: baseUrl,
	};

	return (
		<>
			<JsonLdScript data={organization} />
			<JsonLdScript data={website} />
			<JsonLdScript data={store} />
		</>
	);
}
