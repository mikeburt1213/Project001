import * as FileSystem from 'expo-file-system/legacy';

import type { DetectedProduct, ItemCategory } from '../types';

const XAI_BASE = 'https://api.x.ai/v1';
const MODEL = 'grok-4.5';

const CATEGORIES: ItemCategory[] = [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'bakery',
  'frozen',
  'beverages',
  'snacks',
  'pantry',
  'cereal',
  'canned',
  'condiments',
  'international',
  'household',
  'paper',
  'personal_care',
  'baby',
  'pet',
  'pharmacy',
  'other',
];

function isCategory(value: unknown): value is ItemCategory {
  return typeof value === 'string' && (CATEGORIES as string[]).includes(value);
}

function normalizeItems(raw: unknown): DetectedProduct[] {
  if (!raw || typeof raw !== 'object') return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items
    .map((entry): DetectedProduct | null => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;
      const name = typeof e.name === 'string' ? e.name.trim() : '';
      if (!name) return null;
      const category = isCategory(e.category) ? e.category : 'other';
      const quantity =
        typeof e.quantity === 'number' && e.quantity > 0
          ? Math.min(99, Math.round(e.quantity))
          : 1;
      const notes = typeof e.notes === 'string' ? e.notes.trim() : undefined;
      return { name, category, quantity, notes: notes || undefined };
    })
    .filter((x): x is DetectedProduct => x !== null);
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not include JSON.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const p = payload as Record<string, unknown>;
  if (typeof p.output_text === 'string' && p.output_text.trim()) {
    return p.output_text;
  }
  // OpenAI-compatible responses API shape
  if (Array.isArray(p.output)) {
    const parts: string[] = [];
    for (const item of p.output) {
      if (!item || typeof item !== 'object') continue;
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (c && typeof c === 'object') {
          const text = (c as { text?: unknown; type?: unknown }).text;
          if (typeof text === 'string') parts.push(text);
        }
      }
    }
    if (parts.length) return parts.join('\n');
  }
  if (typeof p.content === 'string') return p.content;
  return JSON.stringify(payload);
}

async function uriToDataUrl(uri: string): Promise<string> {
  const lower = uri.toLowerCase();
  const mime = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${mime};base64,${base64}`;
}

/**
 * Identify grocery products in a photo via SpaceXAI (xAI) vision.
 * Requires an XAI_API_KEY (settings or EXPO_PUBLIC_XAI_API_KEY).
 */
export async function detectProductsFromPhoto(
  photoUri: string,
  apiKey: string,
): Promise<DetectedProduct[]> {
  if (!apiKey.trim()) {
    throw new Error(
      'Add your SpaceXAI (xAI) API key in Settings to identify items from photos.',
    );
  }

  const imageDataUrl = await uriToDataUrl(photoUri);

  const prompt = `You are a grocery shopping assistant. Look at this photo and list every distinct grocery / household product the shopper likely wants to buy.

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "items": [
    {
      "name": "string — concise product name",
      "category": "one of: ${CATEGORIES.join(', ')}",
      "quantity": 1,
      "notes": "optional short note (brand, size, variety)"
    }
  ]
}

Rules:
- Prefer common shopping-list names (e.g. "Whole milk", "Bananas", "Paper towels").
- If multiple products are visible, include each.
- If the image is not a product (person, receipt, blank), return {"items":[]}.
- quantity defaults to 1 unless a pack count is obvious.`;

  const response = await fetch(`${XAI_BASE}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: imageDataUrl,
              detail: 'high',
            },
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Vision API error (${response.status}): ${errText.slice(0, 200) || response.statusText}`,
    );
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  const parsed = extractJsonObject(text);
  return normalizeItems(parsed);
}
