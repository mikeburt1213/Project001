import type { ItemCategory, StoreDefinition } from '../types';

/** Shared category defaults used as a fallback when a store has no override. */
const DEFAULT_AISLES: Record<ItemCategory, { aisle: string; section: string }> = {
  produce: { aisle: 'Produce', section: 'Fresh Produce' },
  dairy: { aisle: 'Dairy', section: 'Dairy & Eggs' },
  meat: { aisle: 'Meat', section: 'Meat Counter' },
  seafood: { aisle: 'Seafood', section: 'Seafood Counter' },
  bakery: { aisle: 'Bakery', section: 'Bakery' },
  frozen: { aisle: 'Frozen', section: 'Frozen Foods' },
  beverages: { aisle: 'Beverages', section: 'Drinks' },
  snacks: { aisle: 'Snacks', section: 'Chips & Snacks' },
  pantry: { aisle: 'Pantry', section: 'Dry Goods' },
  cereal: { aisle: 'Cereal', section: 'Breakfast' },
  canned: { aisle: 'Canned', section: 'Canned Goods' },
  condiments: { aisle: 'Condiments', section: 'Sauces & Condiments' },
  international: { aisle: 'International', section: 'International Foods' },
  household: { aisle: 'Household', section: 'Cleaning' },
  paper: { aisle: 'Paper', section: 'Paper Goods' },
  personal_care: { aisle: 'Personal Care', section: 'Health & Beauty' },
  baby: { aisle: 'Baby', section: 'Baby Care' },
  pet: { aisle: 'Pet', section: 'Pet Supplies' },
  pharmacy: { aisle: 'Pharmacy', section: 'Pharmacy' },
  other: { aisle: 'General', section: 'General Merchandise' },
};

function withAisles(
  overrides: Partial<Record<ItemCategory, { aisle: string; section: string }>>,
): Record<ItemCategory, { aisle: string; section: string }> {
  return { ...DEFAULT_AISLES, ...overrides };
}

/**
 * Approximate aisle maps for common US grocery layouts.
 * Real stores vary by location — treat as guidance, not a floor plan.
 */
export const STORES: StoreDefinition[] = [
  {
    id: 'walmart',
    name: 'Walmart',
    blurb: 'Typical Supercenter grocery layout',
    aisles: withAisles({
      produce: { aisle: '1–2', section: 'Produce' },
      bakery: { aisle: '3', section: 'Bakery' },
      dairy: { aisle: '28–30', section: 'Dairy' },
      meat: { aisle: 'Meat wall', section: 'Fresh Meat' },
      seafood: { aisle: 'Meat wall', section: 'Seafood' },
      frozen: { aisle: '7–10', section: 'Frozen' },
      beverages: { aisle: '11–12', section: 'Beverages' },
      snacks: { aisle: '13–14', section: 'Snacks' },
      cereal: { aisle: '15', section: 'Cereal' },
      pantry: { aisle: '16–18', section: 'Pantry' },
      canned: { aisle: '17', section: 'Canned Goods' },
      condiments: { aisle: '19', section: 'Condiments' },
      international: { aisle: '20', section: 'International' },
      household: { aisle: '4–5', section: 'Household' },
      paper: { aisle: '6', section: 'Paper Goods' },
      personal_care: { aisle: '31–33', section: 'Personal Care' },
      baby: { aisle: '34', section: 'Baby' },
      pet: { aisle: '35', section: 'Pet' },
      pharmacy: { aisle: 'Pharmacy', section: 'Pharmacy' },
    }),
  },
  {
    id: 'kroger',
    name: 'Kroger',
    blurb: 'Typical Kroger / affiliate layout',
    aisles: withAisles({
      produce: { aisle: 'Produce', section: 'Produce' },
      bakery: { aisle: 'Bakery', section: 'Bakery' },
      dairy: { aisle: '1–2', section: 'Dairy' },
      meat: { aisle: 'Meat', section: 'Meat' },
      seafood: { aisle: 'Seafood', section: 'Seafood' },
      frozen: { aisle: '12–14', section: 'Frozen' },
      beverages: { aisle: '8–9', section: 'Beverages' },
      snacks: { aisle: '6–7', section: 'Snacks' },
      cereal: { aisle: '5', section: 'Cereal' },
      pantry: { aisle: '3–4', section: 'Grocery' },
      canned: { aisle: '4', section: 'Canned' },
      condiments: { aisle: '3', section: 'Condiments' },
      international: { aisle: '10', section: 'International' },
      household: { aisle: '15–16', section: 'Household' },
      paper: { aisle: '16', section: 'Paper' },
      personal_care: { aisle: '17–18', section: 'HBA' },
      baby: { aisle: '19', section: 'Baby' },
      pet: { aisle: '20', section: 'Pet' },
      pharmacy: { aisle: 'Pharmacy', section: 'Pharmacy' },
    }),
  },
  {
    id: 'target',
    name: 'Target',
    blurb: 'Typical Target grocery + essentials',
    aisles: withAisles({
      produce: { aisle: 'Grocery front', section: 'Produce' },
      dairy: { aisle: 'A1–A2', section: 'Dairy' },
      meat: { aisle: 'A3', section: 'Meat' },
      seafood: { aisle: 'A3', section: 'Seafood' },
      bakery: { aisle: 'Bakery', section: 'Bakery' },
      frozen: { aisle: 'A8–A10', section: 'Frozen' },
      beverages: { aisle: 'A11–A12', section: 'Beverages' },
      snacks: { aisle: 'A6–A7', section: 'Snacks' },
      cereal: { aisle: 'A5', section: 'Cereal' },
      pantry: { aisle: 'A4–A5', section: 'Grocery' },
      canned: { aisle: 'A4', section: 'Canned' },
      condiments: { aisle: 'A4', section: 'Condiments' },
      international: { aisle: 'A13', section: 'International' },
      household: { aisle: 'B1–B3', section: 'Household' },
      paper: { aisle: 'B2', section: 'Paper' },
      personal_care: { aisle: 'C1–C4', section: 'Beauty & Personal Care' },
      baby: { aisle: 'D1', section: 'Baby' },
      pet: { aisle: 'E1', section: 'Pet' },
      pharmacy: { aisle: 'Pharmacy', section: 'CVS Pharmacy' },
    }),
  },
  {
    id: 'costco',
    name: 'Costco',
    blurb: 'Warehouse-style sections (not numbered aisles)',
    aisles: withAisles({
      produce: { aisle: 'Produce', section: 'Front / right' },
      bakery: { aisle: 'Bakery', section: 'Front bakery' },
      dairy: { aisle: 'Coolers', section: 'Refrigerated wall' },
      meat: { aisle: 'Meat', section: 'Meat coolers' },
      seafood: { aisle: 'Meat', section: 'Seafood coolers' },
      frozen: { aisle: 'Freezers', section: 'Frozen aisle' },
      beverages: { aisle: 'Center', section: 'Drinks pallets' },
      snacks: { aisle: 'Center', section: 'Snacks' },
      cereal: { aisle: 'Center', section: 'Breakfast' },
      pantry: { aisle: 'Center', section: 'Dry goods' },
      canned: { aisle: 'Center', section: 'Canned / bulk' },
      condiments: { aisle: 'Center', section: 'Condiments' },
      international: { aisle: 'Center', section: 'Specialty' },
      household: { aisle: 'Household', section: 'Home / cleaning' },
      paper: { aisle: 'Paper', section: 'Paper goods' },
      personal_care: { aisle: 'HBA', section: 'Health & beauty' },
      baby: { aisle: 'Baby', section: 'Baby' },
      pet: { aisle: 'Pet', section: 'Pet' },
      pharmacy: { aisle: 'Pharmacy', section: 'Pharmacy desk' },
      other: { aisle: 'Seasonal', section: 'General merchandise' },
    }),
  },
  {
    id: 'aldi',
    name: 'ALDI',
    blurb: 'Compact store — sections rather than long aisles',
    aisles: withAisles({
      produce: { aisle: 'Front', section: 'Produce' },
      bakery: { aisle: 'Bakery rack', section: 'Bakery' },
      dairy: { aisle: 'Coolers', section: 'Dairy wall' },
      meat: { aisle: 'Coolers', section: 'Meat' },
      seafood: { aisle: 'Coolers', section: 'Seafood / frozen fish' },
      frozen: { aisle: 'Freezers', section: 'Frozen cases' },
      beverages: { aisle: 'Center', section: 'Drinks' },
      snacks: { aisle: 'Center', section: 'Snacks' },
      cereal: { aisle: 'Center', section: 'Breakfast' },
      pantry: { aisle: 'Center', section: 'Pantry' },
      canned: { aisle: 'Center', section: 'Canned' },
      condiments: { aisle: 'Center', section: 'Condiments' },
      international: { aisle: 'Special buys', section: 'Specialty' },
      household: { aisle: 'Aisle end', section: 'Household' },
      paper: { aisle: 'Aisle end', section: 'Paper' },
      personal_care: { aisle: 'Aisle end', section: 'Personal care' },
      baby: { aisle: 'Aisle end', section: 'Baby' },
      pet: { aisle: 'Aisle end', section: 'Pet' },
      pharmacy: { aisle: 'OTC rack', section: 'OTC / pharmacy items' },
    }),
  },
  {
    id: 'whole_foods',
    name: 'Whole Foods',
    blurb: 'Typical Whole Foods Market layout',
    aisles: withAisles({
      produce: { aisle: 'Produce', section: 'Produce' },
      bakery: { aisle: 'Bakery', section: 'Bakery' },
      dairy: { aisle: '1–2', section: 'Dairy' },
      meat: { aisle: 'Butcher', section: 'Meat counter' },
      seafood: { aisle: 'Seafood', section: 'Seafood counter' },
      frozen: { aisle: '10–11', section: 'Frozen' },
      beverages: { aisle: '8–9', section: 'Beverages' },
      snacks: { aisle: '6–7', section: 'Snacks' },
      cereal: { aisle: '5', section: 'Breakfast' },
      pantry: { aisle: '3–4', section: 'Grocery' },
      canned: { aisle: '4', section: 'Canned' },
      condiments: { aisle: '3', section: 'Condiments' },
      international: { aisle: '12', section: 'Specialty / international' },
      household: { aisle: '13', section: 'Household' },
      paper: { aisle: '13', section: 'Paper' },
      personal_care: { aisle: '14', section: 'Body care' },
      baby: { aisle: '14', section: 'Baby' },
      pet: { aisle: '15', section: 'Pet' },
      pharmacy: { aisle: 'Wellness', section: 'Supplements / wellness' },
    }),
  },
];

export const DEFAULT_STORE_ID = STORES[0].id;

export function getStore(storeId: string): StoreDefinition {
  return STORES.find((s) => s.id === storeId) ?? STORES[0];
}

export function aisleForCategory(
  storeId: string,
  category: ItemCategory,
): { aisle: string; section: string } {
  const store = getStore(storeId);
  return store.aisles[category] ?? store.aisles.other;
}
