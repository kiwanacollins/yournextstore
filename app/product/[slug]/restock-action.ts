"use server";

import { try_ } from "safe-try";
import { restockNotificationCreate } from "@/lib/payload";

export async function subscribeToRestock(variantId: string, email: string) {
	const [error] = await try_(restockNotificationCreate({ email, variantId }));
	if (error) {
		console.error("restock: subscribeToRestock failed", { variantId, error });
		return { success: false as const, error: "Could not save your notification request" };
	}
	return { success: true as const };
}
