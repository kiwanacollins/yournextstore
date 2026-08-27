import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";
import { About } from "@/components/sections/about";
import { CustomOrders } from "@/components/sections/custom-orders";
import { Hero } from "@/components/sections/hero";
import { Occasions } from "@/components/sections/occasions";
import { ProductGrid } from "@/components/sections/product-grid";

function FeaturedProductsSkeleton() {
	return (
		<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
			<div className="flex items-end justify-between mb-12">
				<div>
					<div className="h-8 w-48 bg-secondary rounded animate-pulse" />
					<div className="mt-2 h-5 w-64 bg-secondary rounded animate-pulse" />
				</div>
			</div>
			<ProductGridSkeleton className="lg:grid-cols-3" />
		</section>
	);
}

export default function Home() {
	return (
		<>
			<Hero />
			<Occasions />
			<Suspense fallback={<FeaturedProductsSkeleton />}>
				<ProductGrid
					title="Our custom cakes"
					description="Freshly baked favorites, ready to be customised for your celebration."
					limit={6}
				/>
			</Suspense>
			<CustomOrders />
			<About />
		</>
	);
}
