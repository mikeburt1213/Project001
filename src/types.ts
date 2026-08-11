export type ItemCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'bakery'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'pantry'
  | 'cereal'
  | 'canned'
  | 'condiments'
  | 'international'
  | 'household'
  | 'paper'
  | 'personal_care'
  | 'baby'
  | 'pet'
  | 'pharmacy'
  | 'other';

export type ShoppingItem = {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  notes?: string;
  /** Local photo URI used as a visual location cue */
  photoUri?: string;
  checked: boolean;
  createdAt: number;
};

export type AisleInfo = {
  aisle: string;
  section: string;
};

export type StoreDefinition = {
  id: string;
  name: string;
  /** Short note shown under the store name */
  blurb: string;
  aisles: Record<ItemCategory, AisleInfo>;
};

export type DetectedProduct = {
  name: string;
  category: ItemCategory;
  quantity: number;
  notes?: string;
};
