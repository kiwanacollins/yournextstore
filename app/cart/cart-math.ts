import type { HttpTypes } from "@medusajs/types";

export type CartLineItem = {
	id: string;
	quantity: number;
	unit_price: number;
	variant_id: string;
	product_handle: string;
	product_title: string;
	thumbnail?: string | null;
};

export type Cart = {
	id: string;
	items: CartLineItem[];
};

export function getLineItemUnitPrice(item: CartLineItem): bigint {
	return BigInt(Math.round(item.unit_price));
}

/** Narrows Medusa's full StoreCart response down to what the cart UI needs. */
export function mapStoreCart(cart: HttpTypes.StoreCart): Cart {
	return {
		id: cart.id,
		items: (cart.items ?? []).map((item) => ({
			id: item.id,
			quantity: item.quantity,
			unit_price: item.unit_price,
			variant_id: item.variant_id ?? item.id,
			product_handle: item.product_handle ?? "",
			product_title: item.product_title ?? item.title,
			thumbnail: item.thumbnail,
		})),
	};
}

export type CartAction =
	| { type: "INCREASE"; variantId: string }
	| { type: "DECREASE"; variantId: string }
	| { type: "REMOVE"; variantId: string }
	| { type: "ADD_ITEM"; item: CartLineItem };

// Pure reducer for INSTANT local feedback only. After every mutation the caller
// REPLACES this with the server-returned cart (syncCart) — plain state, no rebase,
// so a local mutation can never be re-applied on top of the authoritative cart.
export function cartReducer(state: Cart | null, action: CartAction): Cart | null {
	if (!state) {
		if (action.type === "ADD_ITEM") {
			return { id: "local", items: [action.item] };
		}
		return state;
	}

	switch (action.type) {
		case "INCREASE":
			return {
				...state,
				items: state.items.map((item) =>
					item.variant_id === action.variantId ? { ...item, quantity: item.quantity + 1 } : item,
				),
			};

		case "DECREASE":
			return {
				...state,
				items: state.items
					.map((item) => {
						if (item.variant_id === action.variantId) {
							if (item.quantity - 1 <= 0) {
								return null;
							}
							return { ...item, quantity: item.quantity - 1 };
						}
						return item;
					})
					.filter((item): item is CartLineItem => item !== null),
			};

		case "REMOVE":
			return {
				...state,
				items: state.items.filter((item) => item.variant_id !== action.variantId),
			};

		case "ADD_ITEM": {
			const existingItem = state.items.find((item) => item.variant_id === action.item.variant_id);

			if (existingItem) {
				return {
					...state,
					items: state.items.map((item) =>
						item.variant_id === action.item.variant_id
							? { ...item, quantity: item.quantity + action.item.quantity }
							: item,
					),
				};
			}

			return {
				...state,
				items: [...state.items, action.item],
			};
		}

		default:
			return state;
	}
}
