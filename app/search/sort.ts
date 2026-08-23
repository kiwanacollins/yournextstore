// Medusa's product list has no native price-sort field, so price sorting is dropped
// for now — only creation date and title (both Medusa-native `order` fields) remain.
export type SortKey = "newest" | "nameAsc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "nameAsc", label: "Alphabetical" },
];

export function getSortFromParams(value: string | undefined): SortKey {
	return SORT_OPTIONS.some((s) => s.value === value) ? (value as SortKey) : "newest";
}

export function sortToBrowseParams(sort: SortKey) {
	switch (sort) {
		case "nameAsc":
			return { order: "title" as const };
		default:
			return { order: "-created_at" as const };
	}
}
