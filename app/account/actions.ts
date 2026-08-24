"use server";

import { try_ } from "safe-try";
import { customerCreate, customerLogin, customerRegisterAuth } from "@/lib/commerce";
import { clearAuthCookie, setAuthCookie } from "@/lib/cookies";

export async function signUp(email: string, password: string, firstName?: string, lastName?: string) {
	const [registerError, registrationToken] = await try_(customerRegisterAuth(email, password));
	if (registerError) {
		console.error("account: signUp registration failed", { email, error: registerError });
		return { success: false, error: "Could not create an account with that email." };
	}

	const [createError] = await try_(
		customerCreate(registrationToken, { email, first_name: firstName, last_name: lastName }),
	);
	if (createError) {
		console.error("account: signUp customer creation failed", { email, error: createError });
		return { success: false, error: "Could not create an account with that email." };
	}

	// Registration succeeded; sign in for a full session token (the registration token
	// is single-purpose and scoped only to the customer.create call above).
	const [loginError, token] = await try_(customerLogin(email, password));
	if (loginError) {
		console.error("account: signUp post-registration login failed", { email, error: loginError });
		return { success: false, error: "Account created — please sign in." };
	}

	await setAuthCookie(token);
	return { success: true as const };
}

export async function signIn(email: string, password: string) {
	const [error, token] = await try_(customerLogin(email, password));
	if (error) {
		console.error("account: signIn failed", { email, error });
		return { success: false, error: "Incorrect email or password." };
	}
	await setAuthCookie(token);
	return { success: true as const };
}

export async function signOut() {
	await clearAuthCookie();
}
