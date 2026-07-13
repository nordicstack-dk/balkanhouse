# Product import template (draft)

This document describes the expected Excel columns for bulk product import via `pnpm import:products`.

> **Draft** — column names and mappings may change once the client provides their product spreadsheet.

## File format

- **Format:** `.xlsx` (Excel) or `.csv`
- **Sheet name:** first sheet is used for Excel files
- **Header row:** row 1 must contain column names (case-insensitive)
- **Locale columns:** suffix with `_ro`, `_da`, or `_en` for localized fields; `_ro` is used when a locale suffix is omitted

## Required columns

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `sku` | text | `BH-001` | Unique product code |
| `title` | text | `Zacuscă de vinete` | Default locale (ro) product title |
| `title_ro` | text | | Romanian product title |
| `title_da` | text | | Danish product title |
| `title_en` | text | | English product title |
| `price_dkk` | number | `49.95` | Price in Danish kroner |
| `unit` | text | `piece` or `kg` | Selling unit |
| `stock_status` | text | `in`, `low`, or `out` | Manual stock indicator (Romanian labels also accepted: `în stoc`, `stoc redus`, `epuizat`) |

## Optional columns

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `category_slug` | text | `conserve` | Matched against category slug (Romanian locale) |
| `allergens` | text | `gluten,milk,nuts` | Comma-separated EU allergen codes |
| `ingredients` | text | `roșii, sare` | Default locale (ro) ingredients |
| `ingredients_ro` | text | | Romanian ingredients |
| `ingredients_da` | text | | Danish ingredients |
| `ingredients_en` | text | | English ingredients |
| `description` | text | Plain text | Default locale (ro); converted to rich text on import |
| `description_ro` | text | | Romanian description |
| `description_da` | text | | Danish description |
| `description_en` | text | | English description |
| `country_of_origin` | text | `RO` | Optional origin |
| `attributes` | JSON text | `{"brand":"Balkan House"}` | Optional extra attributes object |

## Allergen codes

Use these values in the `allergens` column (comma-separated):

`gluten`, `crustaceans`, `eggs`, `fish`, `peanuts`, `soybeans`, `milk`, `nuts`, `celery`, `mustard`, `sesame`, `sulphites`, `lupin`, `molluscs`

## Stock status values

| Value | Meaning |
|-------|---------|
| `in` | In stock |
| `low` | Low stock |
| `out` | Out of stock |

## Usage

```bash
pnpm import:products -- path/to/products.xlsx
```

Dry run (validate only, no writes):

```bash
pnpm import:products -- path/to/products.xlsx --dry-run
```

## Notes

- Images are not imported from Excel; upload media in the admin and attach to products manually (or extend the script later).
- Existing products are matched by `sku` and updated; new SKUs are created.
- Categories must exist in the admin before import if `category_slug` is used.
