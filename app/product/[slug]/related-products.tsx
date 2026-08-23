import { Suspense } from "react";
import { ProductGrid } from "@/components/sections/product-grid";
import { productBrowse } from "@/lib/commerce";

export function RelatedProducts(props: { productId: string; categoryId?: string }) {
	return (
		<Suspense>
			<RelatedProductsContent {...props} />
		</Suspense>
	);
}

async function RelatedProductsContent({ productId, categoryId }: { productId: string; categoryId?: string }) {
	const result = await productBrowse({
		limit: 7,
		...(categoryId ? { category_id: [categoryId] } : {}),
	});

	const related = result.data.filter((p) => p.id !== productId).slice(0, 6);

	if (related.length === 0) return null;

	return (
		<ProductGrid
			title="You might also like"
			description="More products to explore"
			products={related}
			showViewAll={false}
		/>
	);
}
