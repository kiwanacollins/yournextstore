"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUp } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const formData = new FormData(e.currentTarget);
		const email = String(formData.get("email") ?? "");
		const password = String(formData.get("password") ?? "");
		const firstName = String(formData.get("firstName") ?? "");
		const lastName = String(formData.get("lastName") ?? "");

		startTransition(async () => {
			const result = await signUp(email, password, firstName || undefined, lastName || undefined);
			if (result.success) {
				router.push("/account");
				router.refresh();
			} else {
				setError(result.error);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="firstName">First name</Label>
					<Input id="firstName" name="firstName" autoComplete="given-name" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="lastName">Last name</Label>
					<Input id="lastName" name="lastName" autoComplete="family-name" />
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input id="email" name="email" type="email" autoComplete="email" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="new-password"
					required
					minLength={8}
				/>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Creating account…" : "Create account"}
			</Button>
			<p className="text-sm text-muted-foreground text-center">
				Already have an account?{" "}
				<Link href="/account/login" className="text-foreground underline underline-offset-4">
					Sign in
				</Link>
			</p>
		</form>
	);
}
