"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const formData = new FormData(e.currentTarget);
		const email = String(formData.get("email") ?? "");
		const password = String(formData.get("password") ?? "");

		startTransition(async () => {
			const result = await signIn(email, password);
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
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input id="email" name="email" type="email" autoComplete="email" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input id="password" name="password" type="password" autoComplete="current-password" required />
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Signing in…" : "Sign in"}
			</Button>
			<p className="text-sm text-muted-foreground text-center">
				Don't have an account?{" "}
				<Link href="/account/register" className="text-foreground underline underline-offset-4">
					Create one
				</Link>
			</p>
		</form>
	);
}
