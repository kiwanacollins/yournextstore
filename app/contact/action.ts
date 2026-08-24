"use server";

import { try_ } from "safe-try";
import { contactMessageCreate } from "@/lib/payload";

export async function sendContactMessage(input: { email: string; subject?: string; message: string }) {
	const [error] = await try_(contactMessageCreate(input));
	if (error) {
		console.error("contact: sendContactMessage failed", { error });
		return { success: false as const, error: "Could not send your message. Please try again." };
	}
	return { success: true as const };
}
