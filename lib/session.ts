import { try_ } from "safe-try";
import { customerGet } from "@/lib/commerce";
import { getAuthCookie } from "@/lib/cookies";

/** The signed-in customer, or null if there's no session / the token is invalid. */
export async function getCurrentCustomer() {
	const token = await getAuthCookie();
	if (!token) {
		return null;
	}
	const [error, customer] = await try_(customerGet(token));
	if (error) {
		return null;
	}
	return customer;
}
