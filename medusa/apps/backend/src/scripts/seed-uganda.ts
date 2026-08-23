import type { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, ModuleRegistrationName, Modules } from "@medusajs/framework/utils";
import {
	createInventoryLevelsWorkflow,
	createRegionsWorkflow,
	createShippingOptionsWorkflow,
	createStockLocationsWorkflow,
	deleteRegionsWorkflow,
	deleteStockLocationsWorkflow,
	linkSalesChannelsToStockLocationWorkflow,
	updateProductVariantsWorkflow,
	updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// UGX price per existing EUR-priced variant, keyed by SKU (10 EUR -> ~37,000 UGX,
// 15 EUR -> ~55,000 UGX, matching the original demo seed's two price points).
const UGX_BY_SKU_PREFIX: Record<string, number> = {
	"SHIRT-": 37000,
	"SWEATSHIRT-": 75000,
	"SWEATPANTS-": 65000,
	"SHORTS-": 45000,
};

function ugxForSku(sku: string): number {
	const prefix = Object.keys(UGX_BY_SKU_PREFIX).find((p) => sku.startsWith(p));
	return prefix ? UGX_BY_SKU_PREFIX[prefix] : 50000;
}

// Local/dev seed: replaces the default Medusa Europe/EUR seed data with a Uganda/UGX
// setup (region, warehouse, shipping zone, UGX variant prices). Idempotent — safe to
// re-run, each step checks for existing data first.
export default async function seedUganda({ container }: { container: MedusaContainer }) {
	const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
	const link = container.resolve(ContainerRegistrationKeys.LINK);
	const query = container.resolve(ContainerRegistrationKeys.QUERY);
	const fulfillmentModuleService = container.resolve(ModuleRegistrationName.FULFILLMENT);
	const storeModuleService = container.resolve(ModuleRegistrationName.STORE);
	const salesChannelModuleService = container.resolve(ModuleRegistrationName.SALES_CHANNEL);

	const [store] = await storeModuleService.listStores();
	const [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
		name: "Default Sales Channel",
	});

	logger.info("Removing default Europe region and warehouse...");
	const { data: oldRegions } = await query.graph({ entity: "region", fields: ["id", "name"] });
	const europeRegion = oldRegions.find((r) => r.name === "Europe");
	if (europeRegion) {
		await deleteRegionsWorkflow(container).run({ input: { ids: [europeRegion.id] } });
	}

	const { data: oldStockLocations } = await query.graph({
		entity: "stock_location",
		fields: ["id", "name"],
	});
	const europeWarehouse = oldStockLocations.find((l) => l.name === "European Warehouse");
	if (europeWarehouse) {
		await deleteStockLocationsWorkflow(container).run({ input: { ids: [europeWarehouse.id] } });
	}

	logger.info("Setting UGX as the default store currency...");
	await updateStoresWorkflow(container).run({
		input: {
			selector: { id: store.id },
			update: {
				supported_currencies: [
					{ currency_code: "ugx", is_default: true },
					{ currency_code: "usd", is_default: false },
				],
			},
		},
	});

	const { data: existingRegions } = await query.graph({ entity: "region", fields: ["id", "name"] });
	let region = existingRegions.find((r) => r.name === "Uganda");
	if (!region) {
		logger.info("Seeding Uganda region...");
		const { result: regionResult } = await createRegionsWorkflow(container).run({
			input: {
				regions: [
					{
						name: "Uganda",
						currency_code: "ugx",
						countries: ["ug"],
						payment_providers: ["pp_system_default"],
					},
				],
			},
		});
		region = regionResult[0];
	} else {
		logger.info("Uganda region already exists, skipping.");
	}

	const { data: existingStockLocations } = await query.graph({
		entity: "stock_location",
		fields: ["id", "name"],
	});
	let stockLocation = existingStockLocations.find((l) => l.name === "Kampala Warehouse");
	if (!stockLocation) {
		logger.info("Seeding Kampala warehouse...");
		const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
			input: {
				locations: [
					{
						name: "Kampala Warehouse",
						address: {
							city: "Kampala",
							country_code: "UG",
							address_1: "",
						},
					},
				],
			},
		});
		stockLocation = stockLocationResult[0];

		await link.create({
			[Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
			[Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
		});

		logger.info("Seeding fulfillment data...");
		const { data: shippingProfileResult } = await query.graph({
			entity: "shipping_profile",
			fields: ["id"],
		});
		const shippingProfile = shippingProfileResult[0];

		const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
			name: "Uganda delivery",
			type: "shipping",
			service_zones: [
				{
					name: "Uganda",
					geo_zones: [{ country_code: "ug", type: "country" }],
				},
			],
		});

		await link.create({
			[Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
			[Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
		});

		await createShippingOptionsWorkflow(container).run({
			input: [
				{
					name: "Standard Delivery",
					price_type: "flat",
					provider_id: "manual_manual",
					service_zone_id: fulfillmentSet.service_zones[0].id,
					shipping_profile_id: shippingProfile.id,
					type: {
						label: "Standard",
						description: "Delivered in 2-4 days.",
						code: "standard",
					},
					prices: [
						{ currency_code: "ugx", amount: 10000 },
						{ region_id: region.id, amount: 10000 },
					],
					rules: [
						{ attribute: "enabled_in_store", value: "true", operator: "eq" },
						{ attribute: "is_return", value: "false", operator: "eq" },
					],
				},
			],
		});
		logger.info("Finished seeding fulfillment data.");

		await linkSalesChannelsToStockLocationWorkflow(container).run({
			input: {
				id: stockLocation.id,
				add: [defaultSalesChannel.id],
			},
		});
	} else {
		logger.info("Kampala warehouse already exists, skipping fulfillment setup.");
	}

	logger.info("Adding UGX prices to existing demo product variants...");
	const { data: variants } = await query.graph({
		entity: "product_variant",
		fields: ["id", "sku", "prices.*"],
	});

	const variantsMissingUgx = variants.filter(
		(variant) => !(variant.prices ?? []).some((p: { currency_code: string }) => p.currency_code === "ugx"),
	);

	if (variantsMissingUgx.length > 0) {
		await updateProductVariantsWorkflow(container).run({
			input: {
				product_variants: variantsMissingUgx.map((variant) => ({
					id: variant.id,
					prices: [
						...(variant.prices ?? []).map((p: { currency_code: string; amount: number }) => ({
							currency_code: p.currency_code,
							amount: p.amount,
						})),
						{ currency_code: "ugx", amount: ugxForSku(variant.sku ?? "") },
					],
				})),
			},
		});
	}
	logger.info("Finished adding UGX prices.");

	logger.info("Seeding inventory levels...");
	const { data: inventoryItems } = await query.graph({ entity: "inventory_item", fields: ["id"] });
	const { data: existingLevels } = await query.graph({
		entity: "inventory_level",
		fields: ["inventory_item_id", "location_id"],
		filters: { location_id: stockLocation.id },
	});
	const stockedItemIds = new Set(existingLevels.map((l) => l.inventory_item_id));
	const itemsNeedingStock = inventoryItems.filter((item) => !stockedItemIds.has(item.id));

	if (itemsNeedingStock.length > 0) {
		await createInventoryLevelsWorkflow(container).run({
			input: {
				inventory_levels: itemsNeedingStock.map((item) => ({
					location_id: stockLocation?.id,
					stocked_quantity: 1_000_000,
					inventory_item_id: item.id,
				})),
			},
		});
	}
	logger.info("Finished seeding inventory levels.");
}
