import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlogProductEmbed } from "@/app/blog/[slug]/blog-product-embed";
import { LexicalRenderer } from "@/components/lexical-renderer";
import { postGet } from "@/lib/payload";
import { YNSMedia } from "@/lib/yns-media";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const post = await postGet(slug);

	if (!post) {
		return { title: "Post Not Found", robots: { index: false, follow: true } };
	}

	return {
		title: post.seoTitle || post.title,
		description: post.seoDescription || post.excerpt || undefined,
		alternates: { canonical: `/blog/${post.slug}` },
		openGraph: {
			type: "article",
			title: post.title,
			description: post.excerpt || undefined,
			url: `/blog/${post.slug}`,
			images: post.featuredImage?.url ? [{ url: post.featuredImage.url }] : undefined,
		},
	};
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	"use cache";
	cacheLife("minutes");

	const { slug } = await params;
	const post = await postGet(slug);

	if (!post) {
		notFound();
	}

	return (
		<article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{post.title}</h1>
			{post.publishedAt && (
				<p className="mt-3 text-sm text-muted-foreground">
					{new Date(post.publishedAt).toLocaleDateString("en-UG", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
			)}

			{post.featuredImage?.url && (
				<div className="relative mt-8 aspect-video overflow-hidden rounded-lg bg-secondary">
					<YNSMedia
						src={post.featuredImage.url}
						alt={post.title}
						fill
						className="object-cover"
						sizes="768px"
						priority
					/>
				</div>
			)}

			{post.featuredProductId && (
				<Suspense fallback={null}>
					<BlogProductEmbed productId={post.featuredProductId} />
				</Suspense>
			)}

			<LexicalRenderer
				content={post.content}
				className="prose prose-sm dark:prose-invert max-w-none mt-8 text-muted-foreground"
			/>
		</article>
	);
}
