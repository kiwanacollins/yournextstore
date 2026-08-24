"use server";

import { try_ } from "safe-try";
import {
	cartAddShippingMethod,
	cartComplete,
	cartGet,
	cartUpdate,
	paymentSessionInitiate,
	shippingOptionsList,
} from "@/lib/commerce";
import { clearCartCookie, getCartCookieJson } from "@/lib/cookies";

export type ShippingAddressInput = {
	first_name: string;
	last_name: string;
	address_1: string;
	address_2?: string;
	city: string;
	province?: string;
	postal_code?: string;
	country_code: string;
	phone?: string;
};

export async function submitContactAndAddress(email: string, address: ShippingAddressInput) {
	const cartCookie = await getCartCookieJson();
	if (!cartCookie?.id) {
		return { success: false as const, error: "Your cart is empty." };
	}

	const [error] = await try_(
		cartUpdate(cartCookie.id, { email, shipping_address: address, billing_address: address }),
	);
	if (error) {
		console.error("checkout: submitContactAndAddress failed", { cartId: cartCookie.id, error });
		return {
			success: false as const,
			error: "Could not save your address. Please check the details and try again.",
		};
	}
	return { success: true as const };
}

export async function getShippingOptions() {
	const cartCookie = await getCartCookieJson();
	if (!cartCookie?.id) {
		return [];
	}
	const [error, options] = await try_(shippingOptionsList(cartCookie.id));
	if (error) {
		console.error("checkout: getShippingOptions failed", { cartId: cartCookie.id, error });
		return [];
	}
	return options;
}

export async function selectShippingMethod(optionId: string) {
	const cartCookie = await getCartCookieJson();
	if (!cartCookie?.id) {
		return { success: false as const, error: "Your cart is empty." };
	}

	const [error] = await try_(cartAddShippingMethod(cartCookie.id, optionId));
	if (error) {
		console.error("checkout: selectShippingMethod failed", { cartId: cartCookie.id, optionId, error });
		return { success: false as const, error: "Could not select that shipping method." };
	}
	return { success: true as const };
}

/** Initiates payment (manual provider for now) and completes the cart, returning the new order id. */
export async function placeOrder() {
	const cartCookie = await getCartCookieJson();
	if (!cartCookie?.id) {
		return { success: false as const, error: "Your cart is empty." };
	}

	const [cartError, cart] = await try_(cartGet({ cartId: cartCookie.id }));
	if (cartError || !cart) {
		console.error("checkout: placeOrder cartGet failed", { cartId: cartCookie.id, error: cartError });
		return { success: false as const, error: "Could not load your cart." };
	}

	if (!cart.payment_collection) {
		const [paymentError] = await try_(paymentSessionInitiate(cart, "pp_system_default"));
		if (paymentError) {
			console.error("checkout: placeOrder payment session failed", {
				cartId: cartCookie.id,
				error: paymentError,
			});
			return { success: false as const, error: "Could not start payment. Please try again." };
		}
	}

	const [completeError, result] = await try_(cartComplete(cartCookie.id));
	if (completeError) {
		console.error("checkout: placeOrder complete failed", { cartId: cartCookie.id, error: completeError });
		return { success: false as const, error: "Could not place your order. Please try again." };
	}

	if (result.type !== "order") {
		console.error("checkout: placeOrder cart completion returned an error", {
			cartId: cartCookie.id,
			error: result.error,
		});
		return { success: false as const, error: result.error.message || "Could not place your order." };
	}

	// The cart is consumed by a successful completion — clear the cookie so the next
	// add-to-cart starts a fresh cart instead of reusing the now-completed one.
	await clearCartCookie();
	return { success: true as const, orderId: result.order.id };
}
