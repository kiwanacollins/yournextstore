"use server";

import { productBrowse } from "@/lib/commerce";

export type SearchSuggestion = {
	id: string;
	name: string;
	slug: string;
	image: string | null;
	summary: string | null;
};

export async function searchSuggest(query: string): Promise<SearchSuggestion[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) return [];

	const { data } = await productBrowse({ q: trimmed, limit: 6 });
	return data.map((product) => ({
		id: product.id,
		name: product.title,
		slug: product.handle ?? product.id,
		image: product.thumbnail ?? product.images?.[0]?.url ?? null,
		summary: product.description ? stripTags(product.description).slice(0, 120) : null,
	}));
}

function stripTags(html: string): string {
	return html
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
