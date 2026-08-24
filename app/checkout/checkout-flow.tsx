"use client";

import type { HttpTypes } from "@medusajs/types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useCart } from "@/app/cart/cart-context";
import type { Cart } from "@/app/cart/cart-math";
import {
	getShippingOptions,
	placeOrder,
	type ShippingAddressInput,
	selectShippingMethod,
	submitContactAndAddress,
} from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";

type CheckoutFlowProps = {
	cart: Cart;
	currency: string;
	locale: string;
};

type Step = "address" | "shipping" | "review";

export function CheckoutFlow({ cart, currency, locale }: CheckoutFlowProps) {
	const router = useRouter();
	const { clearCart, closeCart } = useCart();
	// The cart sidebar can still be open from the "Checkout" link that led here.
	useEffect(() => {
		closeCart();
	}, [closeCart]);
	const [step, setStep] = useState<Step>("address");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState<ShippingAddressInput | null>(null);
	const [shippingOptions, setShippingOptions] = useState<HttpTypes.StoreCartShippingOptionWithServiceZone[]>(
		[],
	);
	const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const subtotal = cart.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
	const selectedOption = shippingOptions.find((o) => o.id === selectedOptionId) ?? null;
	const total = subtotal + (selectedOption?.amount ?? 0);

	const handleAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const formData = new FormData(e.currentTarget);
		const nextAddress: ShippingAddressInput = {
			first_name: String(formData.get("first_name") ?? ""),
			last_name: String(formData.get("last_name") ?? ""),
			address_1: String(formData.get("address_1") ?? ""),
			address_2: String(formData.get("address_2") ?? "") || undefined,
			city: String(formData.get("city") ?? ""),
			postal_code: String(formData.get("postal_code") ?? "") || undefined,
			country_code: "ug",
			phone: String(formData.get("phone") ?? "") || undefined,
		};
		const nextEmail = String(formData.get("email") ?? "");

		startTransition(async () => {
			const result = await submitContactAndAddress(nextEmail, nextAddress);
			if (!result.success) {
				setError(result.error);
				return;
			}
			setEmail(nextEmail);
			setAddress(nextAddress);
			const options = await getShippingOptions();
			setShippingOptions(options);
			if (options[0]) {
				setSelectedOptionId(options[0].id);
			}
			setStep("shipping");
		});
	};

	const handleShippingSubmit = () => {
		if (!selectedOptionId) return;
		setError(null);

		startTransition(async () => {
			const result = await selectShippingMethod(selectedOptionId);
			if (!result.success) {
				setError(result.error);
				return;
			}
			setStep("review");
		});
	};

	const handlePlaceOrder = () => {
		setError(null);
		startTransition(async () => {
			const result = await placeOrder();
			if (!result.success) {
				setError(result.error);
				return;
			}
			clearCart();
			router.push(`/order/success/${result.orderId}`);
		});
	};

	return (
		<div className="grid lg:grid-cols-[1fr_320px] gap-12">
			<div className="space-y-8">
				{step === "address" && (
					<form onSubmit={handleAddressSubmit} className="space-y-4">
						<h2 className="text-lg font-medium">Contact & shipping address</h2>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" defaultValue={email} required />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="first_name">First name</Label>
								<Input id="first_name" name="first_name" defaultValue={address?.first_name} required />
							</div>
							<div className="space-y-2">
								<Label htmlFor="last_name">Last name</Label>
								<Input id="last_name" name="last_name" defaultValue={address?.last_name} required />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="address_1">Address</Label>
							<Input id="address_1" name="address_1" defaultValue={address?.address_1} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="address_2">Apartment, suite, etc. (optional)</Label>
							<Input id="address_2" name="address_2" defaultValue={address?.address_2} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="city">City</Label>
								<Input id="city" name="city" defaultValue={address?.city} required />
							</div>
							<div className="space-y-2">
								<Label htmlFor="postal_code">Postal code (optional)</Label>
								<Input id="postal_code" name="postal_code" defaultValue={address?.postal_code} />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone (optional)</Label>
							<Input id="phone" name="phone" type="tel" defaultValue={address?.phone} />
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<Button type="submit" disabled={isPending} className="w-full h-12">
							{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to shipping"}
						</Button>
					</form>
				)}

				{step === "shipping" && (
					<div className="space-y-4">
						<h2 className="text-lg font-medium">Shipping method</h2>
						{shippingOptions.length === 0 ? (
							<p className="text-sm text-muted-foreground">No shipping options available for your address.</p>
						) : (
							<div className="space-y-2">
								{shippingOptions.map((option) => (
									<label
										key={option.id}
										className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 cursor-pointer has-checked:border-foreground"
									>
										<span className="flex items-center gap-3">
											<input
												type="radio"
												name="shipping_option"
												value={option.id}
												checked={selectedOptionId === option.id}
												onChange={() => setSelectedOptionId(option.id)}
											/>
											<span className="text-sm font-medium">{option.name}</span>
										</span>
										<span className="text-sm font-semibold">
											{formatMoney({ amount: option.amount, currency, locale })}
										</span>
									</label>
								))}
							</div>
						)}
						{error && <p className="text-sm text-destructive">{error}</p>}
						<div className="flex gap-3">
							<Button variant="outline" onClick={() => setStep("address")} disabled={isPending}>
								Back
							</Button>
							<Button
								onClick={handleShippingSubmit}
								disabled={isPending || !selectedOptionId}
								className="flex-1 h-12"
							>
								{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to review"}
							</Button>
						</div>
					</div>
				)}

				{step === "review" && (
					<div className="space-y-4">
						<h2 className="text-lg font-medium">Review & pay</h2>
						<div className="rounded-lg border border-border p-4 space-y-1 text-sm">
							<p className="font-medium">{email}</p>
							{address && (
								<p className="text-muted-foreground">
									{address.first_name} {address.last_name}, {address.address_1}
									{address.address_2 ? `, ${address.address_2}` : ""}, {address.city}
								</p>
							)}
							{selectedOption && <p className="text-muted-foreground">Shipping: {selectedOption.name}</p>}
						</div>
						<p className="text-sm text-muted-foreground">
							Payment is collected manually for this store — placing the order confirms it without a card
							charge.
						</p>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<div className="flex gap-3">
							<Button variant="outline" onClick={() => setStep("shipping")} disabled={isPending}>
								Back
							</Button>
							<Button onClick={handlePlaceOrder} disabled={isPending} className="flex-1 h-12">
								{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place order"}
							</Button>
						</div>
					</div>
				)}
			</div>

			<div className="space-y-4">
				<h2 className="text-lg font-medium">Order summary</h2>
				<div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
					{cart.items.map((item) => (
						<div key={item.id} className="flex items-center justify-between gap-4 p-4 text-sm">
							<span className="text-muted-foreground">
								{item.product_title} × {item.quantity}
							</span>
							<span className="font-medium">
								{formatMoney({ amount: item.unit_price * item.quantity, currency, locale })}
							</span>
						</div>
					))}
				</div>
				<div className="space-y-2 text-sm">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Subtotal</span>
						<span>{formatMoney({ amount: subtotal, currency, locale })}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Shipping</span>
						<span>
							{selectedOption ? formatMoney({ amount: selectedOption.amount, currency, locale }) : "—"}
						</span>
					</div>
					<div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
						<span>Total</span>
						<span>{formatMoney({ amount: total, currency, locale })}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
