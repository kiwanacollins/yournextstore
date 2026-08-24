"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { submitReview } from "@/app/product/[slug]/review-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ReviewFormProps = {
	productId: string;
};

export function ReviewForm({ productId }: ReviewFormProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	if (status === "success") {
		return (
			<p className="text-sm text-muted-foreground border border-border rounded-lg p-4">
				Thanks for your review! It'll appear here once approved.
			</p>
		);
	}

	if (!isOpen) {
		return (
			<Button variant="outline" onClick={() => setIsOpen(true)}>
				Write a review
			</Button>
		);
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		if (rating === 0) {
			setError("Please select a rating.");
			return;
		}

		const formData = new FormData(e.currentTarget);
		const productSlug = window.location.pathname.split("/").pop() ?? "";

		startTransition(async () => {
			const result = await submitReview({
				productId,
				productSlug,
				authorName: String(formData.get("authorName") ?? ""),
				authorEmail: String(formData.get("authorEmail") ?? ""),
				rating,
				title: String(formData.get("title") ?? "") || undefined,
				content: String(formData.get("content") ?? ""),
			});
			if (result.success) {
				setStatus("success");
			} else {
				setError(result.error);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 border border-border rounded-lg p-6">
			<div className="space-y-2">
				<Label>Rating</Label>
				<div className="flex items-center gap-1">
					{Array.from({ length: 5 }, (_, i) => {
						const value = i + 1;
						return (
							<button
								key={value}
								type="button"
								onClick={() => setRating(value)}
								onMouseEnter={() => setHoveredRating(value)}
								onMouseLeave={() => setHoveredRating(0)}
								aria-label={`${value} star${value === 1 ? "" : "s"}`}
							>
								<Star
									className={cn(
										"h-6 w-6 transition-colors",
										value <= (hoveredRating || rating)
											? "fill-foreground text-foreground"
											: "fill-none text-muted-foreground",
									)}
								/>
							</button>
						);
					})}
				</div>
			</div>
			<div className="grid sm:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="authorName">Name</Label>
					<Input id="authorName" name="authorName" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="authorEmail">Email</Label>
					<Input id="authorEmail" name="authorEmail" type="email" required />
					<p className="text-xs text-muted-foreground">Not shown publicly.</p>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="title">Title (optional)</Label>
				<Input id="title" name="title" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="content">Review</Label>
				<textarea
					id="content"
					name="content"
					required
					rows={4}
					className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
				/>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="flex gap-3">
				<Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
					Cancel
				</Button>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Submitting…" : "Submit review"}
				</Button>
			</div>
		</form>
	);
}
