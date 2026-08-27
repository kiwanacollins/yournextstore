import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getStoreSeo } from "@/lib/commerce";
import { JsonLdScript } from "@/lib/json-ld";

export async function generateMetadata(): Promise<Metadata> {
	const { storeName, storeDescription } = await getStoreSeo();
	const description = storeDescription
		? `Learn more about ${storeName}. ${storeDescription}`
		: `Learn about ${storeName} — our story, our values, and the people behind the products.`;

	return {
		title: "About Us",
		description,
		alternates: { canonical: "/about" },
		openGraph: {
			type: "website",
			title: "About Us",
			description,
			url: "/about",
		},
	};
}

async function getStoreInfo() {
	const { storeName, storeDescription } = await getStoreSeo();
	return { storeName: storeName || "our store", storeDescription };
}

export default async function AboutPage() {
	"use cache";
	cacheLife("hours");

	const { storeName, storeDescription } = await getStoreInfo();

	const aboutJsonLd = {
		"@context": "https://schema.org",
		"@type": "AboutPage",
		name: `About ${storeName}`,
		description:
			storeDescription ?? "Learn about our story, our values, and the people behind the products we make.",
	};

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
			<JsonLdScript data={aboutJsonLd} />

			{/* Header */}
			<div className="mb-10">
				<Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
					Home
				</Link>
				<span className="mx-2 text-muted-foreground">/</span>
				<span className="text-sm">About Us</span>
				<h1 className="mt-4 text-4xl font-medium tracking-tight">About Us</h1>
				{storeDescription && <p className="mt-3 text-lg text-muted-foreground">{storeDescription}</p>}
			</div>

			{/* Story */}
			<div className="space-y-12">
				<section>
					<h2 className="text-2xl font-medium tracking-tight mb-4">Our Story</h2>
					<div className="space-y-4 text-muted-foreground leading-relaxed">
						<p>
							Mutindo Express Cakes Kampala is a professional custom bakery in Kampala, Uganda, passionate
							about fresh, made-to-order cakes. Whether it's a birthday, wedding, introduction, graduation,
							baby shower, or corporate event, we bake every cake to order and customise it to your vision.
						</p>
						<p>
							Our cakes are known for their beautiful custom designs and delicious flavors, paired with a
							reliable delivery service that reaches across Kampala and the surrounding areas — so your
							celebration is as memorable as your cake.
						</p>
					</div>
				</section>

				<section>
					<h2 className="text-2xl font-medium tracking-tight mb-4">Why Choose Us</h2>
					<div className="grid gap-6 sm:grid-cols-3">
						<div>
							<h3 className="text-base font-medium text-foreground">Custom designs</h3>
							<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
								Cakes tailored to your theme, colors, and occasion — beautifully finished.
							</p>
						</div>
						<div>
							<h3 className="text-base font-medium text-foreground">Fresh &amp; delicious</h3>
							<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
								Baked to order with high-quality ingredients and flavors everyone loves.
							</p>
						</div>
						<div>
							<h3 className="text-base font-medium text-foreground">Reliable delivery</h3>
							<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
								Dependable delivery across Kampala and surrounding areas, right on time.
							</p>
						</div>
					</div>
				</section>
			</div>

			{/* CTA */}
			<div className="mt-16 rounded-lg border border-border bg-secondary/30 p-8 text-center">
				<h2 className="text-2xl font-medium tracking-tight">Ready to order a cake?</h2>
				<p className="mt-2 text-muted-foreground">
					Browse our cakes or get in touch — we would love to help plan your celebration.
				</p>
				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Link
						href="/products"
						className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-8 font-medium text-background transition-all hover:bg-foreground/90"
					>
						Browse cakes
					</Link>
				</div>
			</div>
		</div>
	);
}
