import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
	title: "Sign In",
	robots: { index: false, follow: false },
};

export default async function LoginPage() {
	const customer = await getCurrentCustomer();
	if (customer) {
		redirect("/account");
	}

	return (
		<div className="max-w-sm mx-auto px-4 py-16">
			<h1 className="text-2xl font-semibold tracking-tight mb-8">Sign in</h1>
			<LoginForm />
		</div>
	);
}
