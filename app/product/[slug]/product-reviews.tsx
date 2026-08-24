import { Star } from "lucide-react";
import { reviewsBrowse } from "@/lib/payload";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./review-form";

function StarRating({ rating }: { rating: number }) {
	return (
		<div role="img" aria-label={`${rating} out of 5 stars`} className="flex items-center gap-0.5">
			{Array.from({ length: 5 }, (_, i) => (
				<Star
					key={i}
					className={cn(
						"h-4 w-4",
						i < rating ? "fill-foreground text-foreground" : "fill-none text-muted-foreground",
					)}
				/>
			))}
		</div>
	);
}

export async function ProductReviews({ productId }: { productId: string }) {
	const { docs: reviews, totalDocs } = await reviewsBrowse(productId);
	const averageRating =
		reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

	return (
		<section className="mt-16 border-t border-border pt-12">
			<div className="flex items-center justify-between gap-4 mb-8">
				<div>
					<h2 className="text-2xl font-medium tracking-tight">Reviews</h2>
					{averageRating !== null && (
						<div className="mt-2 flex items-center gap-2">
							<StarRating rating={Math.round(averageRating)} />
							<span className="text-sm text-muted-foreground">
								{averageRating.toFixed(1)} out of 5 ({totalDocs} {totalDocs === 1 ? "review" : "reviews"})
							</span>
						</div>
					)}
				</div>
			</div>

			<ReviewForm productId={productId} />

			{reviews.length === 0 ? (
				<p className="mt-8 text-sm text-muted-foreground">No reviews yet — be the first to write one.</p>
			) : (
				<div className="mt-8 divide-y divide-border">
					{reviews.map((review) => (
						<div key={review.id} className="py-6 first:pt-0">
							<div className="flex items-center gap-3">
								<StarRating rating={review.rating} />
								<span className="text-sm font-medium">{review.authorName}</span>
							</div>
							{review.title && <p className="mt-2 text-sm font-medium">{review.title}</p>}
							<p className="mt-1 text-sm text-muted-foreground">{review.content}</p>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
