import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGES = [
	"red-velvet-rose-cake-01.jpeg",
	"pink-crown-oreo-cake-01.jpeg",
	"floral-mom-cake-01.jpeg",
	"teal-scroll-heart-cake-01.jpeg",
];

function heroSrc(name: string) {
	return `/Mutindo%20Express%20Cakes%20Kampala/${name}`;
}

export function Hero() {
	return (
		<section className="relative overflow-hidden border-b border-border bg-secondary/40">
			{/* Warm baked-in texture */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[0.4]"
				style={{
					backgroundImage: "radial-gradient(oklch(0.5 0.04 50 / 0.06) 1px, transparent 1px)",
					backgroundSize: "22px 22px",
				}}
			/>
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 items-center py-16 sm:py-20 lg:py-24">
					{/* Copy */}
					<div className="max-w-2xl">
						<p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium tracking-wide uppercase text-accent-foreground">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							Fresh &amp; baked to order
						</p>
						<h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05] font-medium tracking-tight text-foreground text-balance">
							Custom cakes for life&rsquo;s sweetest moments
						</h1>
						<p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
							Beautifully designed, freshly baked cakes for birthdays, weddings, graduations, baby showers,
							and corporate events — delivered across Kampala and beyond.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row gap-4">
							<Link
								href="#products"
								className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground text-base font-medium shadow-sm hover:bg-primary/90 transition-colors"
							>
								Order a custom cake
								<ArrowRightIcon className="h-4 w-4" />
							</Link>
							<Link
								href="#about"
								className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border border-border bg-background text-base font-medium hover:bg-secondary transition-colors"
							>
								Our story
							</Link>
						</div>
						<dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
							<div>
								<dt className="sr-only">Custom designs</dt>
								<dd className="font-display text-2xl sm:text-3xl font-medium text-foreground">100%</dd>
								<dd className="mt-1 text-sm text-muted-foreground">Custom designs</dd>
							</div>
							<div>
								<dt className="sr-only">Delivery</dt>
								<dd className="font-display text-2xl sm:text-3xl font-medium text-foreground">Same-day</dd>
								<dd className="mt-1 text-sm text-muted-foreground">Kampala delivery</dd>
							</div>
							<div>
								<dt className="sr-only">Occasions</dt>
								<dd className="font-display text-2xl sm:text-3xl font-medium text-foreground">6+</dd>
								<dd className="mt-1 text-sm text-muted-foreground">Occasions served</dd>
							</div>
						</dl>
					</div>

					{/* Imagery */}
					<div className="relative mt-14 lg:mt-0">
						{/* Arc frame backdrop */}
						<div
							aria-hidden="true"
							className="absolute inset-0 -ml-6 -mt-6 rounded-[36%_36%_12%_12%/22%_22%_8%_8%] bg-gradient-to-b from-primary/15 to-primary/5"
						/>
						<div className="relative grid grid-cols-2 gap-4">
							{HERO_IMAGES.slice(0, 2).map((name, i) => (
								<div key={name} className={`relative aspect-[3/4] ${i === 1 ? "mt-10" : ""}`}>
									<Image
										src={heroSrc(name)}
										alt="Custom cake from Mutindo Express Cakes"
										fill
										sizes="(max-width: 1024px) 50vw, 25vw"
										className="object-cover rounded-[28%_28%_12%_12%/20%_20%_8%_8%] ring-1 ring-border/40"
									/>
								</div>
							))}
						</div>
						{/* Floating badge */}
						<div className="absolute -right-3 top-6 hidden sm:flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-sm">
							<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
								<ArrowRightIcon className="h-4 w-4 rotate-[-45deg]" />
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">Delivered fresh</p>
								<p className="text-xs text-muted-foreground">Across Kampala</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
