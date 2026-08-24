import "@/app/globals.css";

import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { CartBootstrap, CartProvider } from "@/app/cart/cart-context";
import { type Cart, mapStoreCart } from "@/app/cart/cart-math";
import { CartSidebar } from "@/app/cart/cart-sidebar";
import { CartButton } from "@/app/cart-button";
import { Footer } from "@/app/footer";
import { Navbar, type NavLink } from "@/app/navbar";
import { CookieConsent } from "@/components/cookie-consent";
import { ErrorOverlayRemover, NavigationReporter } from "@/components/devtools";
import { SearchInput } from "@/components/search/search-input";
import { StoreConfigProvider } from "@/components/store-config-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { cartGet, collectionBrowse, getCanonicalUrl, getStoreSeo } from "@/lib/commerce";
import { getCartCookieJson } from "@/lib/cookies";
import { StoreJsonLd } from "@/lib/json-ld";
import { getStoreConfig } from "@/lib/store-config";

const DEFAULT_FAVICON = "/logo.svg";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

async function getStoreMetadata(): Promise<Metadata> {
	"use cache";
	cacheLife("hours");
	const { storeName, storeDescription: rawDescription } = await getStoreSeo();
	const storeDescription = rawDescription ?? undefined;
	const faviconUrl = DEFAULT_FAVICON;
	const ogImage = DEFAULT_FAVICON;

	return {
		title: {
			default: storeName,
			template: `%s — ${storeName}`,
		},
		description: storeDescription,
		applicationName: storeName,
		alternates: {
			canonical: "/",
		},
		openGraph: {
			type: "website",
			siteName: storeName,
			title: storeName,
			description: storeDescription,
			url: "/",
			images: [{ url: ogImage, alt: storeName }],
		},
		twitter: {
			card: "summary_large_image",
			title: storeName,
			description: storeDescription,
			images: [ogImage],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-image-preview": "large",
				"max-snippet": -1,
				"max-video-preview": -1,
			},
		},
		icons: {
			icon: [{ url: faviconUrl, sizes: "any", type: "image/svg+xml" }],
			apple: [{ url: faviconUrl }],
			shortcut: faviconUrl,
		},
		manifest: "/manifest.webmanifest",
	};
}

export async function generateMetadata(): Promise<Metadata> {
	const metadata = await getStoreMetadata();
	// URL instances can't cross the "use cache" serialization boundary, so
	// metadataBase is attached outside the cached scope (env-only, no IO).
	return { ...metadata, metadataBase: new URL(getCanonicalUrl()) };
}

async function getInitialCart(): Promise<{ cart: Cart | null; cartId: string | null }> {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return { cart: null, cartId: null };
	}

	try {
		const cart = await cartGet({ cartId: cartCookie.id });
		return { cart: cart ? mapStoreCart(cart) : null, cartId: cartCookie.id };
	} catch {
		return { cart: null, cartId: cartCookie.id };
	}
}

async function getNavLinks(): Promise<NavLink[]> {
	"use cache";
	cacheLife("hours");
	const collections = await collectionBrowse({ limit: 5 });
	return [
		{ href: "/", label: "Home" },
		{ href: "/products", label: "Products" },
		...collections.data.map((collection: { handle: string | null; id: string; title: string }) => ({
			href: `/collection/${collection.handle ?? collection.id}`,
			label: collection.title,
		})),
	];
}

// The customer's cart is a cookie read, so it can never be part of the prerendered
// shell. Kept in its own component (and its own Suspense boundary below) so the await
// lands BELOW the chrome instead of above it.
async function CartBootstrapper() {
	const { cart, cartId } = await getInitialCart();

	return <CartBootstrap cart={cart} cartId={cartId} />;
}

async function CartProviderWrapper({ children }: { children: React.ReactNode }) {
	// Only cached reads here. Awaiting anything request-time (cookies, headers, the
	// cart) would take the header, nav and footer out of the prerendered shell and
	// leave the page blank until the server responds.
	const [links, storeConfig] = await Promise.all([getNavLinks(), getStoreConfig()]);

	return (
		<StoreConfigProvider value={storeConfig}>
			<CartProvider>
				<div className="flex min-h-screen flex-col">
					<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="relative flex items-center justify-between h-16">
								<div className="flex items-center gap-2">
									<Link href="/" className="text-xl font-bold">
										Your Next Store
									</Link>
									<Navbar links={links} />
								</div>
								<div className="flex items-center gap-2">
									<Suspense>
										<SearchInput />
									</Suspense>
									<ThemeToggle />
									{/* Static on purpose: reading the session here would pull the header out of
									    the prerendered shell. /account itself redirects guests to sign-in. */}
									<Link
										href="/account"
										className="p-2 hover:bg-secondary transition-colors"
										aria-label="Account"
									>
										<UserRound className="w-5 h-5" />
									</Link>
									<CartButton />
								</div>
							</div>
						</div>
					</header>
					<main className="flex-1">{children}</main>
					<Footer />
				</div>
				<CartSidebar />
				<Suspense>
					<CartBootstrapper />
				</Suspense>
			</CartProvider>
		</StoreConfigProvider>
	);
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const env = process.env.VERCEL_ENV || "development";

	return (
		// suppressHydrationWarning: next-themes sets the theme class on <html> before hydration.
		<html lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{/* DO NOT REMOVE / REORDER: required for GDPR + GTM Consent Mode v2. Must stay at top of <body>. */}
				<Suspense>
					<CookieConsent />
				</Suspense>
				<Suspense>
					<StoreJsonLd />
				</Suspense>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<Suspense>
						<CartProviderWrapper>{children}</CartProviderWrapper>
					</Suspense>
					<Toaster richColors position="top-center" />
				</ThemeProvider>
				{env === "development" && (
					<>
						<NavigationReporter />
						<ErrorOverlayRemover />
					</>
				)}
			</body>
		</html>
	);
}
