import { cacheLife } from "next/cache";
import { CURRENCY, LOCALE } from "@/lib/constants";

// The store's configured currency/locale. Env-driven now that there's no hosted
// "store settings" record. Cached so consumers can stay part of the prerendered shell.
export async function getStoreConfig() {
	"use cache";
	cacheLife("hours");

	return {
		currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || CURRENCY,
		locale: process.env.NEXT_PUBLIC_STORE_LOCALE || LOCALE,
	};
}
