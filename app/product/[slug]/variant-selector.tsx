"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

type VariantValue = {
	id: string;
	value: string;
	variantType: {
		id: string;
		label: string;
	};
};

type Combination = {
	variantValue: VariantValue;
};

type Variant = {
	id: string;
	combinations: Combination[];
};

type VariantOption = {
	id: string;
	value: string;
};

type VariantGroup = {
	label: string;
	options: VariantOption[];
};

type VariantSelectorProps = {
	variants: Variant[];
};

function processVariants(variants: Variant[]) {
	const allCombinations = variants.flatMap((variant) =>
		variant.combinations.map((combination) => ({
			variantValue: combination.variantValue,
		})),
	);

	// Track seen option IDs per label for O(1) deduplication
	const seenOptionIds = new Map<string, Set<string>>();

	const groupedByLabel = allCombinations.reduce(
		(acc, { variantValue }) => {
			const { label } = variantValue.variantType;

			if (!acc[label]) {
				acc[label] = { label, options: [] };
				seenOptionIds.set(label, new Set());
			}

			const seenIds = seenOptionIds.get(label);
			if (seenIds && !seenIds.has(variantValue.id)) {
				seenIds.add(variantValue.id);
				acc[label].options.push({
					id: variantValue.id,
					value: variantValue.value,
				});
			}

			return acc;
		},
		{} as Record<string, VariantGroup>,
	);

	return Object.values(groupedByLabel);
}

export function VariantSelector({ variants }: VariantSelectorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const variantGroups = processVariants(variants);

	// Build Maps for O(1) lookups
	const { optionsByValue, optionsById } = useMemo(() => {
		const optionsByValue = new Map(
			variantGroups.map((g) => [g.label, new Map(g.options.map((o) => [o.value, o]))]),
		);
		const optionsById = new Map(
			variantGroups.map((g) => [g.label, new Map(g.options.map((o) => [o.id, o]))]),
		);
		return { optionsByValue, optionsById };
	}, [variantGroups]);

	const selectedOptions = useMemo(() => {
		const paramsOptions: Record<string, string> = {};
		searchParams.forEach((valueName, key) => {
			const option = optionsByValue.get(key)?.get(valueName);
			if (option) {
				paramsOptions[key] = option.id;
			}
		});
		return paramsOptions;
	}, [searchParams, optionsByValue]);

	const handleOptionSelect = (label: string, optionId: string) => {
		const newSelectedOptions = { ...selectedOptions, [label]: optionId };

		const params = Object.entries(newSelectedOptions).reduce((acc, [key, value]) => {
			const option = optionsById.get(key)?.get(value);
			if (option) {
				acc.set(key, option.value);
			}
			return acc;
		}, new URLSearchParams());
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// Auto-redirect to first variant when no URL params exist (for multi-variant products)
	useEffect(() => {
		if (variants.length <= 1 || searchParams.size > 0) return;

		const firstVariant = variants[0];
		if (!firstVariant) return;
		const params = new URLSearchParams();
		firstVariant.combinations.forEach((c) => {
			params.set(c.variantValue.variantType.label, c.variantValue.value);
		});
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}, [variants, searchParams.size, pathname]);

	const groupsWithChoices = variantGroups.filter((group) => group.options.length > 1);

	if (groupsWithChoices.length === 0) {
		return null;
	}

	return (
		<div className="space-y-8">
			{groupsWithChoices.map((group) => (
				<fieldset key={group.label} className="border-0 p-0 m-0">
					<div className="mb-3 flex items-center justify-between">
						<legend className="text-sm font-medium">{group.label}</legend>
					</div>
					<div className="flex flex-wrap gap-3">
						{group.options.map((option) => {
							const isSelected = selectedOptions[group.label] === option.id;

							return (
								<button
									key={option.id}
									type="button"
									onClick={() => handleOptionSelect(group.label, option.id)}
									className={cn(
										"flex flex-col items-center rounded-lg border-2 px-6 py-3 transition-all duration-200",
										isSelected
											? "border-foreground bg-foreground text-background"
											: "border-border bg-background hover:border-muted-foreground",
									)}
								>
									<span className="text-sm font-medium">{option.value}</span>
								</button>
							);
						})}
					</div>
				</fieldset>
			))}
		</div>
	);
}
