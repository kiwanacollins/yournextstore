import Medusa from "@medusajs/js-sdk";
import { cacheLife } from "next/cache";
import { invariant } from "@/lib/invariant";

invariant(
	process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
	"Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable. Add it to .env.local (see .env.example).",
);

// Store API client (publishable key), used for all storefront browsing/cart/order calls.
// Token storage is "nostore": auth is a per-request bearer token read from our own
// httpOnly cookie (see lib/auth-cookies.ts) and passed explicitly via headers, since
// Server Components/Actions have no browser storage to persist a token in.
export const medusa = new Medusa({
	baseUrl: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
	publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
	auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
});

export function authHeaders(token: string | null): Record<string, string> {
	return token ? { authorization: `Bearer ${token}` } : {};
}

let regionIdPromise: Promise<string> | null = null;

/** The store's single configured region (Uganda/UGX). Resolved once and memoized per isolate. */
export function getDefaultRegionId(): Promise<string> {
	regionIdPromise ??= medusa.store.region
		.list({ limit: 1 })
		.then(({ regions }) => {
			invariant(regions[0], "No region configured in Medusa. Run the seed script first.");
			return regions[0].id;
		})
		.catch((error: unknown) => {
			regionIdPromise = null;
			throw error;
		});
	return regionIdPromise;
}

export async function productBrowse(params: {
	category_id?: string[];
	collection_id?: string[];
	q?: string;
	limit?: number;
	offset?: number;
	order?: string;
}) {
	const region_id = await getDefaultRegionId();
	const { products, count, offset, limit } = await medusa.store.product.list({
		...params,
		region_id,
		fields: "*variants.calculated_price,*variants.inventory_quantity,*images,*categories,*collection",
	});
	return { data: products, count, offset, limit };
}

export async function productGet({ idOrSlug }: { idOrSlug: string }) {
	const region_id = await getDefaultRegionId();
	const isId = idOrSlug.startsWith("prod_");
	const { products } = await medusa.store.product.list({
		...(isId ? { id: [idOrSlug] } : { handle: idOrSlug }),
		region_id,
		limit: 1,
		fields:
			"*variants.calculated_price,*variants.inventory_quantity,*images,*categories,*collection,*options,*options.values",
	});
	return products[0] ?? null;
}

export async function categoryGet({ idOrSlug }: { idOrSlug: string }) {
	const isId = idOrSlug.startsWith("pcat_");
	const { product_categories } = await medusa.store.category.list({
		...(isId ? { id: [idOrSlug] } : { handle: idOrSlug }),
		limit: 1,
	});
	return product_categories[0] ?? null;
}

export async function categoriesBrowse(params?: { limit?: number; offset?: number }) {
	const { product_categories, count, offset, limit } = await medusa.store.category.list(params);
	return { data: product_categories, count, offset, limit };
}

export async function collectionGet({ idOrSlug }: { idOrSlug: string }) {
	const isId = idOrSlug.startsWith("pcol_");
	const { collections } = await medusa.store.collection.list({
		...(isId ? { id: [idOrSlug] } : { handle: idOrSlug }),
		limit: 1,
	});
	return collections[0] ?? null;
}

export async function collectionBrowse(params?: { limit?: number; offset?: number }) {
	const { collections, count, offset, limit } = await medusa.store.collection.list(params);
	return { data: collections, count, offset, limit };
}

// No single facets endpoint in Medusa; derive available filters from categories/collections.
// Price-bounds and variant-option faceting are dropped for now.
export async function productFilters() {
	const [{ data: categories }, { data: collections }] = await Promise.all([
		categoriesBrowse({ limit: 100 }),
		collectionBrowse({ limit: 100 }),
	]);
	return { categories, collections };
}

export async function cartGet({ cartId }: { cartId: string }) {
	// Line items already carry their own unit_price (locked in at add-to-cart time) —
	// expanding items.variant.calculated_price additionally would require passing
	// region/currency context for that nested pricing calculation and isn't needed here.
	const { cart } = await medusa.store.cart.retrieve(cartId, {
		fields: "*items,*items.variant,*shipping_address,*region",
	});
	return cart;
}

export async function cartUpsert(params: {
	cartId?: string;
	variantId: string;
	quantity: number;
	mode?: "add" | "set";
}) {
	const { cartId, variantId, quantity, mode = "add" } = params;

	if (!cartId) {
		const region_id = await getDefaultRegionId();
		const { cart } = await medusa.store.cart.create({
			region_id,
			items: [{ variant_id: variantId, quantity }],
		});
		return cart;
	}

	const existing = await cartGet({ cartId });
	const existingItem = existing.items?.find((item) => item.variant_id === variantId);

	if (!existingItem) {
		if (quantity <= 0) {
			return existing;
		}
		const { cart } = await medusa.store.cart.createLineItem(cartId, { variant_id: variantId, quantity });
		return cart;
	}

	const nextQuantity = mode === "set" ? quantity : existingItem.quantity + quantity;

	if (nextQuantity <= 0) {
		const { parent } = await medusa.store.cart.deleteLineItem(cartId, existingItem.id);
		return parent;
	}

	const { cart } = await medusa.store.cart.updateLineItem(cartId, existingItem.id, {
		quantity: nextQuantity,
	});
	return cart;
}

export async function orderGet({ id }: { id: string }) {
	const { order } = await medusa.store.order.retrieve(id, {
		fields: "*items,*items.variant,*shipping_address,*shipping_methods,*payment_collections",
	});
	return order;
}

export function getCanonicalUrl(): string {
	if (process.env.NEXT_PUBLIC_URL) {
		return process.env.NEXT_PUBLIC_URL.replace(/\/$/, "");
	}
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return "http://localhost:3000";
}

// Store name/description for page-level metadata. Static env-driven config now that
// there's no hosted "store settings" record — cached so it stays in the prerendered shell.
export async function getStoreSeo() {
	"use cache";
	cacheLife("hours");

	return {
		storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Your Next Store",
		storeDescription: process.env.NEXT_PUBLIC_STORE_DESCRIPTION || null,
	};
}
