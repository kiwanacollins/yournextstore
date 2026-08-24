import type { Metadata } from "next";
import { getStoreSeo } from "@/lib/commerce";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
	const { storeName } = await getStoreSeo();
	return {
		title: "Contact Us",
		description: `Get in touch with ${storeName}.`,
		alternates: { canonical: "/contact" },
	};
}

export default function ContactPage() {
	return (
		<div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<h1 className="text-3xl font-semibold tracking-tight mb-2">Contact Us</h1>
			<p className="text-muted-foreground mb-8">
				Have a question about an order or a product? Send us a message and we'll get back to you.
			</p>
			<ContactForm />
		</div>
	);
}
