"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const email = String(new FormData(e.currentTarget).get("email") ?? "");

		startTransition(async () => {
			const result = await subscribeToNewsletter(email);
			if (result.success) {
				setStatus("success");
			} else {
				setError(result.error);
			}
		});
	};

	if (status === "success") {
		return <p className="text-sm text-muted-foreground">You're subscribed — thanks!</p>;
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<div className="flex gap-2">
				<Input type="email" name="email" placeholder="you@example.com" required className="h-9" />
				<Button type="submit" size="sm" disabled={isPending}>
					{isPending ? "…" : "Subscribe"}
				</Button>
			</div>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</form>
	);
}
