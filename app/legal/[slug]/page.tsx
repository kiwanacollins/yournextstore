import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { LexicalRenderer } from "@/components/lexical-renderer";
import { legalPageGet } from "@/lib/payload";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const page = await legalPageGet(slug);

	if (!page) {
		return { title: "Page Not Found", robots: { index: false, follow: true } };
	}

	return {
		title: page.title,
		alternates: { canonical: `/legal/${page.slug}` },
	};
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
	"use cache";
	cacheLife("hours");

	const { slug } = await params;
	const page = await legalPageGet(slug);

	if (!page) {
		notFound();
	}

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<h1 className="text-3xl font-semibold tracking-tight mb-8">{page.title}</h1>
			<LexicalRenderer
				content={page.content}
				className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
			/>
		</div>
	);
}
