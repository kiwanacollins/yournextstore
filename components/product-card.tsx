import Link from "next/link";
import type { productBrowse } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";
import { getStoreConfig } from "@/lib/store-config";
import { isVideoUrl } from "@/lib/utils";
import { YNSMedia } from "@/lib/yns-media";
import { QuickAddButton } from "./quick-add-button";

type CardProduct = Awaited<ReturnType<typeof productBrowse>>["data"][number];

export async function ProductCard({
	product,
	priority = false,
}: {
	product: CardProduct;
	priority?: boolean;
}) {
	const { currency, locale } = await getStoreConfig();
	const variants = product.variants ?? null;
	// Medusa's calculated_price is in MAJOR units (e.g. 19.99, not 1999), while formatMoney
	// expects minor units. This is a no-op for UGX (0 decimal places) but will misformat any
	// non-zero-decimal currency — flagged for the dedicated pricing verification pass.
	const variantAmounts = (variants ?? [])
		.map((v) => v.calculated_price?.calculated_amount)
		.filter((amount): amount is number => typeof amount === "number");
	const minPrice = variantAmounts.length > 0 ? Math.min(...variantAmounts) : null;
	const maxPrice = variantAmounts.length > 0 ? Math.max(...variantAmounts) : null;

	const priceDisplay =
		variants && variants.length > 1 && minPrice !== null && maxPrice !== null && minPrice !== maxPrice
			? `${formatMoney({ amount: minPrice, currency, locale })} - ${formatMoney({ amount: maxPrice, currency, locale })}`
			: minPrice !== null
				? formatMoney({ amount: minPrice, currency, locale })
				: null;

	const allImages = (product.images ?? []).map((img) => img.url);
	const primaryImage = allImages[0] ?? product.thumbnail ?? undefined;
	const secondaryImage = allImages[1];

	const singleVariant =
		variants?.length === 1 && (variants[0]?.inventory_quantity ?? 1) !== 0 ? variants[0] : null;

	return (
		<Link href={`/product/${product.handle}`} className="group">
			<div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
				{singleVariant && (
					<QuickAddButton
						variantId={singleVariant.id}
						variantSku={singleVariant.sku ?? null}
						variantPrice={String(singleVariant.calculated_price?.calculated_amount ?? 0)}
						variantImages={allImages}
						product={{
							id: product.id,
							name: product.title,
							slug: product.handle ?? product.id,
							images: allImages,
						}}
					/>
				)}
				{primaryImage &&
					(isVideoUrl(primaryImage) ? (
						<video
							className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${secondaryImage ? "group-hover:opacity-0" : ""}`}
							src={primaryImage}
							muted
							loop
							autoPlay
							playsInline
						/>
					) : (
						<YNSMedia
							src={primaryImage}
							alt={product.title}
							fill
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
							className={`object-cover transition-opacity duration-500 ${secondaryImage ? "group-hover:opacity-0" : ""}`}
							priority={priority}
						/>
					))}
				{secondaryImage &&
					(isVideoUrl(secondaryImage) ? (
						<video
							className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
							src={secondaryImage}
							muted
							loop
							autoPlay
							playsInline
						/>
					) : (
						<YNSMedia
							src={secondaryImage}
							alt={`${product.title} - alternate view`}
							fill
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
							className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						/>
					))}
			</div>
			<div className="space-y-1">
				<h3 className="text-base font-medium text-foreground">{product.title}</h3>
				<p className="text-base font-semibold text-foreground">{priceDisplay}</p>
			</div>
		</Link>
	);
}
