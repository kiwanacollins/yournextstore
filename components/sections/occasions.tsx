import Image from "next/image";

const OCCASIONS = [
	{
		label: "Birthdays",
		image: "pink-crown-oreo-cake-01.jpeg",
	},
	{
		label: "Weddings",
		image: "white-red-rose-cake-01.jpeg",
	},
	{
		label: "Baby showers",
		image: "strawberry-pearl-cake-01.jpeg",
	},
	{
		label: "Graduations",
		image: "teal-scroll-heart-cake-01.jpeg",
	},
	{
		label: "Introductions",
		image: "floral-mom-cake-01.jpeg",
	},
	{
		label: "Corporate",
		image: "vanilla-cherry-cake-01.jpeg",
	},
] as const;

function heroSrc(name: string) {
	return `/Mutindo%20Express%20Cakes%20Kampala/${name}`;
}

export function Occasions() {
	return (
		<section className="bg-secondary/40 border-y border-border">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
				<div className="max-w-2xl">
					<p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium tracking-wide uppercase text-accent-foreground">
						Every occasion
					</p>
					<h2 className="mt-4 font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
						Made for your celebration
					</h2>
					<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
						Whatever the moment, we bake a cake to match — personalised designs, delicious flavors, and the
						finishing touches that make it yours.
					</p>
				</div>

				<div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
					{OCCASIONS.map((occasion) => (
						<figure key={occasion.label} className="group">
							<div className="relative aspect-[3/4] overflow-hidden rounded-[32%_32%_12%_12%/22%_22%_8%_8%] bg-background ring-1 ring-border/40">
								<Image
									src={heroSrc(occasion.image)}
									alt={`Custom ${occasion.label.toLowerCase()} cake`}
									fill
									sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
									className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
								/>
							</div>
							<figcaption className="mt-4 text-center text-sm font-medium text-foreground">
								{occasion.label}
							</figcaption>
						</figure>
					))}
				</div>
			</div>
		</section>
	);
}
