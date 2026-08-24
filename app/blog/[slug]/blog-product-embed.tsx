import Link from "next/link";
import { productGet } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";
import { getStoreConfig } from "@/lib/store-config";
import { YNSMedia } from "@/lib/yns-media";

export async function BlogProductEmbed({ productId }: { productId: string }) {
	const [product, { currency, locale }] = await Promise.all([
		productGet({ idOrSlug: productId }),
		getStoreConfig(),
	]);

	if (!product) {
		return null;
	}

	const price = product.variants?.[0]?.calculated_price?.calculated_amount;
	const image = product.images?.[0]?.url ?? product.thumbnail;

	return (
		<Link
			href={`/product/${product.handle ?? product.id}`}
			className="not-prose flex items-center gap-4 rounded-lg border border-border p-4 my-8 hover:bg-secondary/50 transition-colors"
		>
			{image && (
				<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
					<YNSMedia src={image} alt={product.title} fill className="object-cover" sizes="64px" />
				</div>
			)}
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium">{product.title}</p>
				{price != null && (
					<p className="text-sm text-muted-foreground">{formatMoney({ amount: price, currency, locale })}</p>
				)}
			</div>
		</Link>
	);
}
