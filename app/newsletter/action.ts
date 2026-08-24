"use server";

import { try_ } from "safe-try";
import { DuplicateSubscriberError, newsletterSubscribe } from "@/lib/payload";

export async function subscribeToNewsletter(email: string) {
	const [error] = await try_(newsletterSubscribe(email, true));
	if (error) {
		if (error instanceof DuplicateSubscriberError) {
			return { success: true as const };
		}
		console.error("newsletter: subscribeToNewsletter failed", { error });
		return { success: false as const, error: "Could not subscribe. Please try again." };
	}
	return { success: true as const };
}
