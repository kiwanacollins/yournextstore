"use server";

import { try_ } from "safe-try";
import { mapStoreCart } from "@/app/cart/cart-math";
import { cartGet, cartUpsert } from "@/lib/commerce";
import { getCartCookieJson, setCartCookie } from "@/lib/cookies";

export async function getCart() {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return null;
	}

	const [error, cart] = await try_(cartGet({ cartId: cartCookie.id }));
	if (error) {
		console.error("cart: cartGet failed", { cartId: cartCookie.id, error });
		return null;
	}
	return cart ? mapStoreCart(cart) : null;
}

export async function addToCart(variantId: string, quantity = 1) {
	const cartCookie = await getCartCookieJson();

	// The cart cookie can point at a cartId that no longer exists server-side
	// (expired, store re-seeded, old session). cartUpsert then throws "Cart not found";
	// retry once with a FRESH cart so the add always lands. No revalidatePath — the
	// client syncs from this action's returned cart (the layout cartGet hits a
	// read-replica and can return the pre-write cart, dropping the just-added line).
	let [error, cart] = await try_(cartUpsert({ cartId: cartCookie?.id, variantId, quantity }));
	if (error) {
		[error, cart] = await try_(cartUpsert({ variantId, quantity }));
		if (error) {
			console.error("cart: addToCart failed after fresh-cart retry", { variantId, quantity, error });
			return { success: false, cart: null };
		}
	}

	if (!cart) {
		return { success: false, cart: null };
	}

	if (cart.id !== cartCookie?.id) {
		await setCartCookie({ id: cart.id });
	}

	return { success: true, cart: mapStoreCart(cart) };
}

export async function removeFromCart(variantId: string) {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return { success: false, cart: null };
	}

	// Quantity 0 removes the item; the response is the updated cart
	const [error, cart] = await try_(
		cartUpsert({
			cartId: cartCookie.id,
			variantId,
			quantity: 0,
		}),
	);
	if (error) {
		console.error("cart: removeFromCart failed", { cartId: cartCookie.id, variantId, error });
		return { success: false, cart: null };
	}
	return { success: true, cart: cart ? mapStoreCart(cart) : null };
}

// Set absolute quantity for a cart item
export async function setCartQuantity(variantId: string, quantity: number) {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return { success: false, cart: null };
	}

	// mode "set" replaces the line quantity atomically; 0 removes the item
	const [error, cart] = await try_(
		cartUpsert({
			cartId: cartCookie.id,
			variantId,
			quantity: Math.max(quantity, 0),
			mode: "set",
		}),
	);
	if (error) {
		console.error("cart: setCartQuantity failed", { cartId: cartCookie.id, variantId, quantity, error });
		return { success: false, cart: null };
	}
	return { success: true, cart: cart ? mapStoreCart(cart) : null };
}
