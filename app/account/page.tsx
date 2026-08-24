import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { orderList } from "@/lib/commerce";
import { getAuthCookie } from "@/lib/cookies";
import { formatMoney } from "@/lib/money";
import { getCurrentCustomer } from "@/lib/session";
import { getStoreConfig } from "@/lib/store-config";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
	title: "Your Account",
	robots: { index: false, follow: false },
};

export default async function AccountPage() {
	const customer = await getCurrentCustomer();
	if (!customer) {
		redirect("/account/login");
	}

	const token = await getAuthCookie();
	const { currency, locale } = await getStoreConfig();
	const { data: orders } = token ? await orderList({ token }) : { data: [] };

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="flex items-start justify-between mb-8">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{customer.first_name ? `Hi, ${customer.first_name}` : "Your Account"}
					</h1>
					<p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
				</div>
				<SignOutButton />
			</div>

			<h2 className="text-lg font-medium mb-4">Order history</h2>
			{orders.length === 0 ? (
				<p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
			) : (
				<div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
					{orders.map((order) => (
						<Link
							key={order.id}
							href={`/account/orders/${order.id}`}
							className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
						>
							<div>
								<p className="text-sm font-medium">Order #{order.display_id}</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{new Date(order.created_at).toLocaleDateString(locale)}
								</p>
							</div>
							<span className="text-sm font-semibold">
								{formatMoney({ amount: order.total, currency, locale })}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
