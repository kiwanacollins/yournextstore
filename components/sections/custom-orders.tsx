import { MessageSquareMore, Palette, Truck, UtensilsCrossed } from "lucide-react";

const STEPS = [
	{
		icon: MessageSquareMore,
		step: "01",
		title: "Tell us about your cake",
		body: "Share the occasion, date, flavors, and any design inspiration you have in mind.",
	},
	{
		icon: Palette,
		step: "02",
		title: "We design it with you",
		body: "We craft a custom design and quote tailored to your theme, colors, and budget.",
	},
	{
		icon: UtensilsCrossed,
		step: "03",
		title: "We bake it fresh",
		body: "Your cake is baked to order with quality ingredients — never from stock.",
	},
	{
		icon: Truck,
		step: "04",
		title: "Delivered on time",
		body: "Safely delivered across Kampala and surrounding areas, ready for your moment.",
	},
] as const;

export function CustomOrders() {
	return (
		<section className="bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
				<div className="grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 items-start">
					<div className="lg:sticky lg:top-28">
						<p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium tracking-wide uppercase text-accent-foreground">
							Custom orders
						</p>
						<h2 className="mt-4 font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight">
							Every cake starts with a conversation
						</h2>
						<p className="mt-5 text-lg text-muted-foreground leading-relaxed">
							We're a made-to-order bakery, so your cake is created just for you — from the first idea to the
							final slice.
						</p>
					</div>

					<ol className="mt-10 lg:mt-0 space-y-3">
						{STEPS.map((item) => (
							<li
								key={item.step}
								className="group flex gap-5 rounded-2xl border border-border bg-secondary/30 p-5 transition-colors hover:border-primary/40"
							>
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<item.icon className="h-5 w-5" />
								</div>
								<div className="flex-1">
									<div className="flex items-baseline justify-between gap-4">
										<h3 className="text-base font-semibold text-foreground">{item.title}</h3>
										<span className="font-display text-sm text-muted-foreground">{item.step}</span>
									</div>
									<p className="mt-1 text-muted-foreground leading-relaxed">{item.body}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}
