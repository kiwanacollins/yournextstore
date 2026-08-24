import { invariant } from "@/lib/invariant";

invariant(
	process.env.PAYLOAD_URL,
	"Missing PAYLOAD_URL environment variable. Add it to .env.local (see .env.example).",
);

const PAYLOAD_URL = process.env.PAYLOAD_URL;

export type LexicalRichText = {
	root: {
		children: unknown[];
		[key: string]: unknown;
	};
};

export type Post = {
	id: number;
	title: string;
	slug: string;
	excerpt?: string | null;
	content: LexicalRichText;
	featuredImage?: { url?: string | null } | null;
	featuredProductId?: string | null;
	publishedAt?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
};

export type LegalPage = {
	id: number;
	title: string;
	slug: string;
	content: LexicalRichText;
	showInFooter: boolean;
};

export type Review = {
	id: number;
	productId: string;
	authorName: string;
	rating: number;
	title?: string | null;
	content: string;
	status: "pending" | "approved" | "rejected";
	createdAt: string;
};

export type SiteSettings = {
	storeName: string;
	storeDescription?: string | null;
	favicon?: { url?: string | null } | null;
	ogImage?: { url?: string | null } | null;
	showBlogLink: boolean;
	showContactLink: boolean;
};

type PaginatedResponse<T> = {
	docs: T[];
	totalDocs: number;
	hasNextPage: boolean;
};

async function payloadFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
	const url = new URL(`/api${path}`, PAYLOAD_URL);
	for (const [key, value] of Object.entries(params ?? {})) {
		url.searchParams.set(key, value);
	}
	const res = await fetch(url, { next: { revalidate: 60 } });
	if (!res.ok) {
		throw new Error(`Payload request failed: ${res.status} ${url.pathname}${url.search}`);
	}
	return res.json();
}

export async function postBrowse(params?: { limit?: number; page?: number }) {
	return payloadFetch<PaginatedResponse<Post>>("/posts", {
		limit: String(params?.limit ?? 10),
		page: String(params?.page ?? 1),
		sort: "-publishedAt",
		"where[publishedAt][less_than_equal]": new Date().toISOString(),
	});
}

export async function postGet(slug: string): Promise<Post | null> {
	const { docs } = await payloadFetch<PaginatedResponse<Post>>("/posts", {
		"where[slug][equals]": slug,
		limit: "1",
	});
	return docs[0] ?? null;
}

export async function legalPageBrowse() {
	const { docs } = await payloadFetch<PaginatedResponse<LegalPage>>("/legal-pages", {
		"where[showInFooter][equals]": "true",
		limit: "100",
	});
	return docs;
}

export async function legalPageGet(slug: string): Promise<LegalPage | null> {
	const { docs } = await payloadFetch<PaginatedResponse<LegalPage>>("/legal-pages", {
		"where[slug][equals]": slug,
		limit: "1",
	});
	return docs[0] ?? null;
}

export async function reviewsBrowse(productId: string) {
	return payloadFetch<PaginatedResponse<Review>>("/reviews", {
		"where[productId][equals]": productId,
		"where[status][equals]": "approved",
		sort: "-createdAt",
		limit: "50",
	});
}

export async function reviewCreate(input: {
	productId: string;
	authorName: string;
	authorEmail: string;
	rating: number;
	title?: string;
	content: string;
}) {
	const res = await fetch(new URL("/api/reviews", PAYLOAD_URL), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Payload review submission failed: ${res.status} ${body}`);
	}
	return res.json();
}

export class DuplicateSubscriberError extends Error {}

export async function newsletterSubscribe(email: string, marketingConsent: boolean) {
	const res = await fetch(new URL("/api/newsletter-subscribers", PAYLOAD_URL), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, marketingConsent }),
	});
	if (!res.ok) {
		const body = await res.text();
		if (res.status === 400 && body.includes("must be unique")) {
			throw new DuplicateSubscriberError("Email is already subscribed");
		}
		throw new Error(`Payload newsletter subscription failed: ${res.status} ${body}`);
	}
	return res.json();
}

export async function contactMessageCreate(input: { email: string; subject?: string; message: string }) {
	const res = await fetch(new URL("/api/contact-messages", PAYLOAD_URL), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Payload contact message submission failed: ${res.status} ${body}`);
	}
	return res.json();
}

export async function restockNotificationCreate(input: { email: string; variantId: string }) {
	const res = await fetch(new URL("/api/restock-notifications", PAYLOAD_URL), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Payload restock notification submission failed: ${res.status} ${body}`);
	}
	return res.json();
}

export async function getSiteSettings(): Promise<SiteSettings> {
	return payloadFetch<SiteSettings>("/globals/site-settings");
}
