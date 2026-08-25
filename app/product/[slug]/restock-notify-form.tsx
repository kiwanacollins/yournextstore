"use client";

import { useState, useTransition } from "react";
import { subscribeToRestock } from "@/app/product/[slug]/restock-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RestockNotifyForm({ variantId }: { variantId: string }) {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const email = String(new FormData(e.currentTarget).get("email") ?? "");

		startTransition(async () => {
			const result = await subscribeToRestock(variantId, email);
			if (result.success) {
				setStatus("success");
			} else {
				setStatus("error");
				setError(result.error);
			}
		});
	};

	if (status === "success") {
		return <p className="text-sm text-muted-foreground">We'll email you when this is back in stock.</p>;
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<div className="flex gap-2">
				<Input type="email" name="email" placeholder="you@example.com" required className="h-11 flex-1" />
				<Button type="submit" disabled={isPending} className="h-11">
					{isPending ? "…" : "Notify me"}
				</Button>
			</div>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</form>
	);
}
