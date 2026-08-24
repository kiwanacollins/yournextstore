import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { orderGet } from "@/lib/commerce";
import { OrderSummary } from "@/lib/order-detail";
import { getCurrentCustomer } from "@/lib/session";
import { getStoreConfig } from "@/lib/store-config";

export const metadata: Metadata = {
	title: "Order Details",
	robots: { index: false, follow: false },
};

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
	const customer = await getCurrentCustomer();
	if (!customer) {
		redirect("/account/login");
	}

	const { id } = await params;
	const { currency, locale } = await getStoreConfig();
	const order = await orderGet({ id });

	if (!order || order.customer_id !== customer.id) {
		notFound();
	}

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<Link
				href="/account"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
			>
				<ChevronLeft className="h-4 w-4" />
				Back to orders
			</Link>
			<h1 className="text-2xl font-semibold tracking-tight mb-8">Order #{order.display_id}</h1>
			<OrderSummary order={order} currency={currency} locale={locale} />
		</div>
	);
}
