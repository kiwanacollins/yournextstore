import type { HttpTypes } from "@medusajs/types";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orderGet } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";
import { getStoreConfig } from "@/lib/store-config";
import { YNSMedia } from "@/lib/yns-media";

export const metadata: Metadata = {
	title: "Order Confirmed",
	robots: { index: false, follow: false },
};

function OrderSkeleton() {
	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="text-center mb-10 flex flex-col items-center">
				<Skeleton className="h-16 w-16 rounded-full" />
				<Skeleton className="mt-4 h-8 w-72" />
				<Skeleton className="mt-3 h-4 w-52" />
			</div>
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}

// Awaiting params at the top of the page blocks the static shell — the page
// stays a sync shell and the order details stream inside Suspense. The order
// fetch stays uncached so the confirmation always reflects the latest state.
export default function OrderSuccessPage(props: { params: Promise<{ id: string }> }) {
	return (
		<Suspense fallback={<OrderSkeleton />}>
			<OrderDetails params={props.params} />
		</Suspense>
	);
}

const OrderDetails = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const { currency, locale } = await getStoreConfig();
	const order = await orderGet({ id });

	if (!order) {
		notFound();
	}

	const lineItems = order.items ?? [];
	const shippingAddress = order.shipping_address;
	const shippingMethod = order.shipping_methods?.[0];

	const subtotal = order.item_subtotal ?? order.subtotal ?? 0;
	const shippingCost = order.shipping_total ?? shippingMethod?.total ?? 0;
	const total = order.total ?? subtotal + shippingCost;

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Success Header */}
			<div className="text-center mb-10">
				<div className="flex justify-center mb-4">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<CheckCircle className="h-8 w-8 text-green-600" />
					</div>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">Thank you for your order!</h1>
				<p className="text-muted-foreground mt-2">Order #{order.display_id} has been confirmed</p>
				{order.email && (
					<p className="text-sm text-muted-foreground mt-1">
						A confirmation email will be sent to {order.email}
					</p>
				)}
			</div>

			{/* Order Items */}
			<div className="border border-border rounded-lg overflow-hidden">
				<div className="bg-secondary/50 px-6 py-4 border-b border-border">
					<h2 className="font-medium">Order Items</h2>
				</div>
				<div className="divide-y divide-border">
					{lineItems.map((item) => (
						<OrderItem key={item.id} item={item} currency={currency} locale={locale} />
					))}
				</div>

				{/* Order Summary */}
				<div className="bg-secondary/30 px-6 py-4 space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span>{formatMoney({ amount: subtotal, currency, locale })}</span>
					</div>
					{shippingMethod && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Shipping ({shippingMethod.name})</span>
							<span>{formatMoney({ amount: shippingCost, currency, locale })}</span>
						</div>
					)}
					<div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
						<span>Total</span>
						<span>{formatMoney({ amount: total, currency, locale })}</span>
					</div>
				</div>
			</div>

			{/* Shipping Address */}
			{shippingAddress && (
				<div className="border border-border rounded-lg overflow-hidden mt-6">
					<div className="bg-secondary/50 px-6 py-4 border-b border-border">
						<h2 className="font-medium">Shipping Address</h2>
					</div>
					<div className="px-6 py-4 text-sm text-muted-foreground">
						{(shippingAddress.first_name || shippingAddress.last_name) && (
							<p className="text-foreground font-medium">
								{[shippingAddress.first_name, shippingAddress.last_name].filter(Boolean).join(" ")}
							</p>
						)}
						{shippingAddress.address_1 && <p>{shippingAddress.address_1}</p>}
						{shippingAddress.address_2 && <p>{shippingAddress.address_2}</p>}
						<p>
							{[shippingAddress.city, shippingAddress.province, shippingAddress.postal_code]
								.filter(Boolean)
								.join(", ")}
						</p>
						{shippingAddress.country_code && <p>{shippingAddress.country_code.toUpperCase()}</p>}
					</div>
				</div>
			)}

			{/* Continue Shopping Button */}
			<div className="mt-8 text-center">
				<Button asChild>
					<Link href="/">Continue Shopping</Link>
				</Button>
			</div>
		</div>
	);
};

async function OrderItem({
	item,
	currency,
	locale,
}: {
	item: HttpTypes.StoreOrderLineItem;
	currency: string;
	locale: string;
}) {
	const image = item.thumbnail;
	const lineTotal = item.total ?? item.unit_price * item.quantity;
	const productHandle = item.product_handle ?? item.product_id;

	return (
		<div className="flex gap-4 p-6">
			{/* Product Image */}
			<Link
				href={productHandle ? `/product/${productHandle}` : "#"}
				className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
			>
				{image && (
					<YNSMedia
						src={image}
						alt={item.product_title ?? item.title}
						fill
						className="object-cover"
						sizes="80px"
					/>
				)}
			</Link>

			{/* Product Details */}
			<div className="flex min-w-0 flex-1 flex-col justify-between">
				<div>
					<Link
						href={productHandle ? `/product/${productHandle}` : "#"}
						className="text-sm font-medium leading-tight text-foreground hover:underline line-clamp-2"
					>
						{item.product_title ?? item.title}
					</Link>
					<p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
				</div>
				<p className="text-sm font-semibold">{formatMoney({ amount: lineTotal, currency, locale })}</p>
			</div>
		</div>
	);
}
