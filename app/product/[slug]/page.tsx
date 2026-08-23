import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartButton } from "@/app/product/[slug]/add-to-cart-button";
import { MediaGallery } from "@/app/product/[slug]/media-gallery";
import { ProductFeatures } from "@/app/product/[slug]/product-features";
import { RelatedProducts } from "@/app/product/[slug]/related-products";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { productGet } from "@/lib/commerce";
import { buildProductBreadcrumbJsonLd, buildProductJsonLd, JsonLdScript } from "@/lib/json-ld";
import { TrackProductView } from "@/lib/track";

// MediaGallery and the purchase panel read useSearchParams (selected variant),
// so they need a Suspense boundary to keep the rest of the page prerenderable.
function GallerySkeleton() {
	return (
		<div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
			<Skeleton className="aspect-square rounded-2xl" />
		</div>
	);
}

function PurchasePanelSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-9 w-40" />
			<Skeleton className="h-12 w-full rounded-full" />
		</div>
	);
}

function ProductPageSkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<Skeleton className="mb-6 h-5 w-64" />
			<div className="lg:grid lg:grid-cols-2 lg:gap-16">
				<GallerySkeleton />
				<div className="mt-8 lg:mt-0 space-y-8">
					<Skeleton className="h-12 w-3/4" />
					<PurchasePanelSkeleton />
				</div>
			</div>
		</div>
	);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	"use cache";
	cacheLife("minutes");
	const { slug } = await params;
	const product = await productGet({ idOrSlug: slug });

	if (!product) {
		return { title: "Product Not Found", robots: { index: false, follow: true } };
	}

	const seoTitle = product.title;
	const seoDescription = product.description || undefined;
	const canonical = `/product/${product.handle}`;
	const image = product.images?.[0]?.url ?? product.thumbnail ?? undefined;

	return {
		title: seoTitle,
		description: seoDescription,
		alternates: { canonical },
		openGraph: {
			type: "website",
			title: seoTitle,
			description: seoDescription,
			url: canonical,
			images: image ? [{ url: image, alt: product.title }] : undefined,
		},
		twitter: {
			card: image ? "summary_large_image" : "summary",
			title: seoTitle,
			description: seoDescription,
			images: image ? [image] : undefined,
		},
	};
}

// Awaiting params at the top of the page blocks the static shell — the page
// stays a sync shell and the params-dependent content streams inside Suspense.
export default function ProductPage(props: { params: Promise<{ slug: string }> }) {
	return (
		<Suspense fallback={<ProductPageSkeleton />}>
			<ProductDetails params={props.params} />
		</Suspense>
	);
}

const getProductPageData = async (slug: string) => {
	"use cache";
	cacheLife("minutes");
	const product = await productGet({ idOrSlug: slug });
	return { product };
};

const ProductDetails = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;
	const { product } = await getProductPageData(slug);

	if (!product) {
		notFound();
	}

	const productImages = (product.images ?? []).map((img) => img.url);
	const allImages = productImages.length > 0 ? productImages : product.thumbnail ? [product.thumbnail] : [];

	// Medusa's variant.options carry {id, value, option: {title}} flat pairs (no color-swatch
	// metadata) — mapped to the selector's {variantValue: {id, value, variantType: {label}}}
	// combination shape, one per option, so multi-select (Size × Color etc.) still works.
	const adaptedVariants = (product.variants ?? []).map((variant) => ({
		id: variant.id,
		price: String(variant.calculated_price?.calculated_amount ?? 0),
		originalPrice: String(
			variant.calculated_price?.original_amount ?? variant.calculated_price?.calculated_amount ?? 0,
		),
		sku: variant.sku ?? null,
		images: productImages,
		stock: variant.inventory_quantity ?? null,
		omnibusPrice: null,
		combinations: (variant.options ?? []).map((option) => ({
			variantValue: {
				id: option.id,
				value: option.value,
				variantType: {
					id: option.option_id ?? option.id,
					label: option.option?.title ?? "Option",
				},
			},
		})),
	}));

	const category = product.categories?.[0];
	const productJsonLd = buildProductJsonLd(product);

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<JsonLdScript data={productJsonLd} />
			<JsonLdScript data={buildProductBreadcrumbJsonLd(product)} />
			{product.variants?.[0] && adaptedVariants[0] && (
				<TrackProductView
					variant={{
						id: product.variants[0].id,
						sku: product.variants[0].sku,
						price: adaptedVariants[0].price,
					}}
					name={product.title}
				/>
			)}
			<Breadcrumb className="mb-6">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/products">Products</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					{category && (
						<>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href={`/category/${category.handle}`}>{category.name}</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
						</>
					)}
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{product.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="lg:grid lg:grid-cols-2 lg:gap-16">
				{/* Left: Image Gallery (sticky on desktop) */}
				<Suspense fallback={<GallerySkeleton />}>
					<MediaGallery images={allImages} productName={product.title} variants={adaptedVariants} />
				</Suspense>

				{/* Right: Product Details */}
				<div className="mt-8 lg:mt-0 space-y-8">
					<div className="space-y-3">
						<h1 className="text-4xl font-medium tracking-tight text-foreground lg:text-5xl text-balance">
							{product.title}
						</h1>
					</div>

					<Suspense fallback={<PurchasePanelSkeleton />}>
						<AddToCartButton
							variants={adaptedVariants}
							product={{
								id: product.id,
								name: product.title,
								slug: product.handle ?? product.id,
								images: allImages,
							}}
							summary={product.description}
						/>
					</Suspense>
				</div>
			</div>

			{/* Full description (below the fold, full width) */}
			{product.description && (
				<section className="mt-16 border-t border-border pt-12">
					<h2 className="mb-6 text-2xl font-medium tracking-tight">Product details</h2>
					<div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line">
						{product.description}
					</div>
				</section>
			)}

			{/* Features Section (full width below) */}
			<ProductFeatures />

			{/* Related Products */}
			<RelatedProducts productId={product.id} categoryId={category?.id} />
		</div>
	);
};
