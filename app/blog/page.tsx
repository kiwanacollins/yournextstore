import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getStoreSeo } from "@/lib/commerce";
import { postBrowse } from "@/lib/payload";
import { YNSMedia } from "@/lib/yns-media";

export async function generateMetadata(): Promise<Metadata> {
	const { storeName } = await getStoreSeo();
	return {
		title: "Blog",
		description: `News, guides, and stories from ${storeName}.`,
		alternates: { canonical: "/blog" },
	};
}

export default async function BlogPage() {
	"use cache";
	cacheLife("minutes");

	const { docs: posts } = await postBrowse({ limit: 24 });

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<h1 className="text-3xl font-semibold tracking-tight mb-2">Blog</h1>
			<p className="text-muted-foreground mb-10">News, guides, and stories from the team.</p>

			{posts.length === 0 ? (
				<p className="text-sm text-muted-foreground">No posts yet — check back soon.</p>
			) : (
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{posts.map((post) => (
						<Link key={post.id} href={`/blog/${post.slug}`} className="group">
							<div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
								{post.featuredImage?.url && (
									<YNSMedia
										src={post.featuredImage.url}
										alt={post.title}
										fill
										className="object-cover transition-transform group-hover:scale-105"
										sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
									/>
								)}
							</div>
							<h2 className="mt-4 text-lg font-medium leading-tight group-hover:underline">{post.title}</h2>
							{post.excerpt && (
								<p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
							)}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
