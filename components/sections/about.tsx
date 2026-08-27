import Image from "next/image";

const STORY_IMAGE = "/Mutindo%20Express%20Cakes%20Kampala/floral-mom-cake-05.jpeg";

const HIGHLIGHTS = [
	{
		title: "Custom designs",
		body: "Every cake is tailored to your theme, colors, and celebration — beautifully finished.",
	},
	{
		title: "Fresh & delicious",
		body: "Baked to order with quality ingredients and flavors that make every slice memorable.",
	},
	{
		title: "Reliable delivery",
		body: "On-time delivery across Kampala and surrounding areas, right to your door.",
	},
] as const;

export function About() {
	return (
		<section id="about" className="bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
				<div className="grid lg:grid-cols-2 lg:gap-16 items-center">
					<div className="relative order-2 lg:order-1 mt-12 lg:mt-0">
						<div
							aria-hidden="true"
							className="absolute inset-0 translate-x-4 translate-y-4 rounded-[24%_24%_10%_10%/18%_18%_8%_8%] bg-primary/10"
						/>
						<div className="relative aspect-[4/5]">
							<Image
								src={STORY_IMAGE}
								alt="A floral custom cake from Mutindo Express Cakes"
								fill
								sizes="(max-width: 1024px) 100vw, 50vw"
								className="object-cover rounded-[24%_24%_10%_10%/18%_18%_8%_8%] ring-1 ring-border/40"
							/>
						</div>
					</div>

					<div className="order-1 lg:order-2">
						<p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium tracking-wide uppercase text-accent-foreground">
							About the bakery
						</p>
						<h2 className="mt-6 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-medium tracking-tight text-foreground leading-tight">
							Baked to order, designed to delight
						</h2>
						<p className="mt-6 text-lg text-muted-foreground leading-relaxed">
							Mutindo Express Cakes Kampala is a professional custom bakery in Kampala, Uganda. From birthdays
							and weddings to introductions, graduations, and corporate events, every cake is freshly baked to
							order and customised around your vision.
						</p>

						<ul className="mt-10 space-y-6">
							{HIGHLIGHTS.map((item) => (
								<li key={item.title} className="flex gap-4">
									<span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
									<div>
										<h3 className="text-base font-semibold text-foreground">{item.title}</h3>
										<p className="mt-1 text-muted-foreground leading-relaxed">{item.body}</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
