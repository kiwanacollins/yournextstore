import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
	title: "Create Account",
	robots: { index: false, follow: false },
};

export default async function RegisterPage() {
	const customer = await getCurrentCustomer();
	if (customer) {
		redirect("/account");
	}

	return (
		<div className="max-w-sm mx-auto px-4 py-16">
			<h1 className="text-2xl font-semibold tracking-tight mb-8">Create an account</h1>
			<RegisterForm />
		</div>
	);
}
