import { cacheLife } from "next/cache";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { collectionBrowse } from "@/lib/commerce";
import { getSiteSettings, legalPageBrowse } from "@/lib/payload";

async function FooterLegalLinks() {
	"use cache";
	cacheLife("hours");

	const pages = await legalPageBrowse();

	if (pages.length === 0) {
		return null;
	}

	return (
		<div>
			<h3 className="text-sm font-semibold text-foreground">Legal</h3>
			<ul className="mt-4 space-y-3">
				{pages.map((page) => (
					<li key={page.id}>
						<Link
							href={`/legal/${page.slug}`}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							{page.title}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

async function FooterCollections() {
	"use cache";
	cacheLife("hours");

	const collections = await collectionBrowse({ limit: 5 });

	if (collections.data.length === 0) {
		return null;
	}

	return (
		<div>
			<h3 className="text-sm font-semibold text-foreground">Collections</h3>
			<ul className="mt-4 space-y-3">
				{collections.data.map((collection) => (
					<li key={collection.id}>
						<Link
							href={`/collection/${collection.handle}`}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							{collection.title}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

// `new Date()` is an unstable value: now that the footer is part of the prerendered
// shell, reading it during the prerender is an error. Caching pins it to the entry.
async function getCopyrightYear() {
	"use cache";
	cacheLife("days");

	return new Date().getFullYear();
}

export async function Footer() {
	const [year, siteSettings] = await Promise.all([getCopyrightYear(), getSiteSettings()]);

	return (
		<footer className="border-t border-border bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16 flex flex-col sm:flex-row gap-8 sm:gap-16">
					{/* Brand */}
					<div className="sm:max-w-xs">
						<Link href="/" className="text-xl font-bold text-foreground">
							Your Next Store
						</Link>
						<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
							Curated essentials for modern living. Quality products, thoughtfully designed.
						</p>
						<div className="mt-6">
							<h3 className="text-sm font-semibold text-foreground mb-3">Newsletter</h3>
							<NewsletterForm />
						</div>
					</div>

					{/* Collections */}
					<FooterCollections />

					{/* Support */}
					<div>
						<h3 className="text-sm font-semibold text-foreground">Support</h3>
						<ul className="mt-4 space-y-3">
							<li>
								<Link
									href="/about"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									href="/faq"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									FAQ
								</Link>
							</li>
							{siteSettings.showBlogLink && (
								<li>
									<Link
										href="/blog"
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										Blog
									</Link>
								</li>
							)}
							{siteSettings.showContactLink && (
								<li>
									<Link
										href="/contact"
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										Contact
									</Link>
								</li>
							)}
						</ul>
					</div>

					{/* Legal */}
					<FooterLegalLinks />
				</div>

				{/* Bottom bar */}
				<div className="py-6 border-t border-border">
					<p className="text-sm text-muted-foreground">&copy; {year} Your Next Store. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}
