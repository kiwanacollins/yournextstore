import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCart } from "@/app/cart/actions";
import { CheckoutFlow } from "@/app/checkout/checkout-flow";
import { getStoreConfig } from "@/lib/store-config";

export const metadata: Metadata = {
	title: "Checkout",
	robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
	const [cart, { currency, locale }] = await Promise.all([getCart(), getStoreConfig()]);

	if (!cart || cart.items.length === 0) {
		redirect("/");
	}

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<h1 className="text-2xl font-semibold tracking-tight mb-8">Checkout</h1>
			<CheckoutFlow cart={cart} currency={currency} locale={locale} />
		</div>
	);
}
