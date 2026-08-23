import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";
import { ProductGrid } from "@/components/sections/product-grid";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { collectionGet, getStoreSeo, productBrowse } from "@/lib/commerce";
import { buildCollectionBreadcrumbJsonLd, buildCollectionJsonLd, JsonLdScript } from "@/lib/json-ld";

type CollectionData = NonNullable<Awaited<ReturnType<typeof collectionGet>>>;

// The page has no pagination, so the collection renders in one browse page. 100 is the API's max.
const COLLECTION_PRODUCTS_LIMIT = 100;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	"use cache";
	cacheLife("minutes");
	const { slug } = await params;
	const collection = await collectionGet({ idOrSlug: slug });

	if (!collection) {
		return { title: "Collection Not Found", robots: { index: false, follow: true } };
	}

	const { storeName } = await getStoreSeo();
	const description = `Shop the ${collection.title} collection at ${storeName}.`;
	const canonical = `/collection/${collection.handle}`;

	return {
		title: collection.title,
		description,
		alternates: { canonical },
		openGraph: {
			type: "website",
			title: collection.title,
			description,
			url: canonical,
		},
		twitter: {
			card: "summary",
			title: collection.title,
			description,
		},
	};
}

function CollectionHeader({ collection }: { collection: CollectionData }) {
	return (
		<section className="relative overflow-hidden bg-secondary/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16 lg:py-20">
					<div className="max-w-2xl">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
							{collection.title}
						</h1>
					</div>
				</div>
			</div>
		</section>
	);
}

function CollectionProductsSkeleton() {
	return (
		<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
			<ProductGridSkeleton className="lg:grid-cols-3" />
		</section>
	);
}

async function CollectionProducts({ collection }: { collection: CollectionData }) {
	const { data: products } = await productBrowse({
		collection_id: [collection.id],
		limit: COLLECTION_PRODUCTS_LIMIT,
	});

	return (
		<ProductGrid
			title={`${collection.title} Collection`}
			description={`${products.length} products`}
			products={products}
			showViewAll={false}
		/>
	);
}

function CollectionPageSkeleton() {
	return (
		<>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
				<div className="h-5 w-48 bg-secondary rounded animate-pulse" />
			</div>
			<section className="bg-secondary/30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="py-12 sm:py-16 lg:py-20">
						<div className="h-12 w-72 bg-secondary rounded animate-pulse" />
					</div>
				</div>
			</section>
			<CollectionProductsSkeleton />
		</>
	);
}

// Awaiting params at the top of the page blocks the static shell — the page
// stays a sync shell and the params-dependent content streams inside Suspense.
export default function CollectionPage(props: PageProps<"/collection/[slug]">) {
	return (
		<Suspense fallback={<CollectionPageSkeleton />}>
			<CollectionContent params={props.params} />
		</Suspense>
	);
}

const getCollectionData = async (slug: string) => {
	"use cache";
	cacheLife("minutes");
	return collectionGet({ idOrSlug: slug });
};

const CollectionContent = async ({ params }: { params: PageProps<"/collection/[slug]">["params"] }) => {
	const { slug } = await params;
	const collection = await getCollectionData(slug);

	if (!collection) {
		notFound();
	}

	return (
		<>
			<JsonLdScript data={buildCollectionJsonLd(collection)} />
			<JsonLdScript data={buildCollectionBreadcrumbJsonLd(collection)} />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link href="/">Home</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{collection.title}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>
			<CollectionHeader collection={collection} />
			<Suspense fallback={<CollectionProductsSkeleton />}>
				<CollectionProducts collection={collection} />
			</Suspense>
		</>
	);
};
