"use server";

import { revalidatePath } from "next/cache";
import { try_ } from "safe-try";
import { reviewCreate } from "@/lib/payload";

export async function submitReview(input: {
	productId: string;
	productSlug: string;
	authorName: string;
	authorEmail: string;
	rating: number;
	title?: string;
	content: string;
}) {
	const { productSlug, ...review } = input;

	const [error] = await try_(reviewCreate(review));
	if (error) {
		console.error("review: submitReview failed", { productId: input.productId, error });
		return { success: false as const, error: "Could not submit your review. Please try again." };
	}

	revalidatePath(`/product/${productSlug}`);
	return { success: true as const };
}
