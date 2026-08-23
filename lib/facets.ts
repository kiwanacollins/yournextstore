import { cacheLife } from "next/cache";
import { productFilters } from "@/lib/commerce";

const EMPTY_FACETS = {
	categories: [],
	collections: [],
} satisfies Awaited<ReturnType<typeof productFilters>>;

export async function getFilterFacets() {
	"use cache";
	cacheLife("minutes");
	// Filters are an enhancement — never let a facets failure take down the product list.
	try {
		return await productFilters();
	} catch {
		return EMPTY_FACETS;
	}
}
