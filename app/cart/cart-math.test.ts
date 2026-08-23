import { expect, test } from "bun:test";
import { type Cart, type CartLineItem, cartReducer, getLineItemUnitPrice } from "@/app/cart/cart-math";

const lineItem = (overrides: Partial<CartLineItem> = {}): CartLineItem => ({
	id: "li-1",
	quantity: 1,
	unit_price: 1000,
	variant_id: "v-1",
	product_handle: "product",
	product_title: "Product",
	thumbnail: null,
	...overrides,
});

test("getLineItemUnitPrice returns the line item's unit price", () => {
	expect(getLineItemUnitPrice(lineItem())).toBe(1000n);
});

test("cartReducer ADD_ITEM creates a local cart from null state", () => {
	const next = cartReducer(null, { type: "ADD_ITEM", item: lineItem() });
	expect(next).toEqual({ id: "local", items: [lineItem()] });
});

test("cartReducer ignores non-add actions on null state", () => {
	expect(cartReducer(null, { type: "INCREASE", variantId: "v-1" })).toBeNull();
});

test("cartReducer ADD_ITEM merges quantities for an existing variant", () => {
	const state: Cart = { id: "c-1", items: [lineItem()] };
	const next = cartReducer(state, { type: "ADD_ITEM", item: { ...lineItem(), quantity: 2 } });
	expect(next?.items).toHaveLength(1);
	expect(next?.items[0]?.quantity).toBe(3);
});

test("cartReducer INCREASE and DECREASE adjust only the targeted variant", () => {
	const other: CartLineItem = { ...lineItem(), variant_id: "v-2" };
	const state: Cart = { id: "c-1", items: [{ ...lineItem(), quantity: 2 }, other] };

	const increased = cartReducer(state, { type: "INCREASE", variantId: "v-1" });
	expect(increased?.items[0]?.quantity).toBe(3);
	expect(increased?.items[1]?.quantity).toBe(1);

	const decreased = cartReducer(state, { type: "DECREASE", variantId: "v-1" });
	expect(decreased?.items[0]?.quantity).toBe(1);
});

test("cartReducer DECREASE removes the line when quantity would hit zero", () => {
	const state: Cart = { id: "c-1", items: [lineItem()] };
	const next = cartReducer(state, { type: "DECREASE", variantId: "v-1" });
	expect(next?.items).toHaveLength(0);
});

test("cartReducer REMOVE drops the line entirely regardless of quantity", () => {
	const state: Cart = { id: "c-1", items: [{ ...lineItem(), quantity: 5 }] };
	const next = cartReducer(state, { type: "REMOVE", variantId: "v-1" });
	expect(next?.items).toHaveLength(0);
});
