import { cookies } from "next/headers";

export const CART_COOKIE = "yns_cart";
export type CartCookieJson = { id: string };

export async function setCartCookie(cartCookieJson: CartCookieJson) {
	try {
		(await cookies()).set(CART_COOKIE, JSON.stringify(cartCookieJson), {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			partitioned: true,
			path: "/",
		});
	} catch (error) {
		console.error("Failed to set cart cookie", error);
	}
}

/** Pure parser for the cart cookie value — exported separately so it can be unit tested. */
export function parseCartCookie(value: string | undefined | null): CartCookieJson | null {
	if (!value) {
		return null;
	}
	try {
		const cartCookieJson: unknown = JSON.parse(value);
		if (
			!cartCookieJson ||
			typeof cartCookieJson !== "object" ||
			!("id" in cartCookieJson) ||
			typeof cartCookieJson.id !== "string"
		) {
			return null;
		}
		return cartCookieJson as CartCookieJson;
	} catch {
		return null;
	}
}

export async function getCartCookieJson(): Promise<null | CartCookieJson> {
	return parseCartCookie((await cookies()).get(CART_COOKIE)?.value);
}

export async function clearCartCookie() {
	(await cookies()).delete(CART_COOKIE);
}

export const AUTH_COOKIE = "yns_auth";

export async function setAuthCookie(token: string) {
	(await cookies()).set(AUTH_COOKIE, token, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30, // 30 days
	});
}

export async function clearAuthCookie() {
	(await cookies()).delete(AUTH_COOKIE);
}

export async function getAuthCookie(): Promise<string | null> {
	return (await cookies()).get(AUTH_COOKIE)?.value ?? null;
}
