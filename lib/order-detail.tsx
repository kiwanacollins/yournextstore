import type { HttpTypes } from "@medusajs/types";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { YNSMedia } from "@/lib/yns-media";

/** Order items, summary, and shipping address — shared by the guest confirmation page and account order detail. */
export function OrderSummary({
	order,
	currency,
	locale,
}: {
	order: HttpTypes.StoreOrder;
	currency: string;
	locale: string;
}) {
	const lineItems = order.items ?? [];
	const shippingAddress = order.shipping_address;
	const shippingMethod = order.shipping_methods?.[0];

	const subtotal = order.item_subtotal ?? order.subtotal ?? 0;
	const shippingCost = order.shipping_total ?? shippingMethod?.total ?? 0;
	const total = order.total ?? subtotal + shippingCost;

	return (
		<>
			<div className="border border-border rounded-lg overflow-hidden">
				<div className="bg-secondary/50 px-6 py-4 border-b border-border">
					<h2 className="font-medium">Order Items</h2>
				</div>
				<div className="divide-y divide-border">
					{lineItems.map((item) => (
						<OrderItem key={item.id} item={item} currency={currency} locale={locale} />
					))}
				</div>

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
		</>
	);
}

function OrderItem({
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
