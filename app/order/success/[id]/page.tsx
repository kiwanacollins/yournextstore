import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orderGet } from "@/lib/commerce";
import { OrderSummary } from "@/lib/order-detail";
import { getStoreConfig } from "@/lib/store-config";

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

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

			<OrderSummary order={order} currency={currency} locale={locale} />

			<div className="mt-8 text-center">
				<Button asChild>
					<Link href="/">Continue Shopping</Link>
				</Button>
			</div>
		</div>
	);
};
