"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/contact/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	if (status === "success") {
		return (
			<p className="text-sm text-muted-foreground border border-border rounded-lg p-6">
				Thanks for reaching out — we'll get back to you soon.
			</p>
		);
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await sendContactMessage({
				email: String(formData.get("email") ?? ""),
				subject: String(formData.get("subject") ?? "") || undefined,
				message: String(formData.get("message") ?? ""),
			});
			if (result.success) {
				setStatus("success");
			} else {
				setError(result.error);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input id="email" name="email" type="email" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="subject">Subject (optional)</Label>
				<Input id="subject" name="subject" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="message">Message</Label>
				<textarea
					id="message"
					name="message"
					required
					rows={6}
					className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
				/>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<Button type="submit" disabled={isPending} className="w-full h-12">
				{isPending ? "Sending…" : "Send message"}
			</Button>
		</form>
	);
}
