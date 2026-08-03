# Product import template

This document describes the expected Excel columns for bulk product import via `pnpm import:products`.

> **Ready-to-use file:** [`product-import-template.xlsx`](./product-import-template.xlsx) — a formatted
> workbook with one column per language, dropdowns for unit/stock/category, an example row to delete,
> and built-in Instructions + Reference sheets.

> **Tip:** prefer `.xlsx` over `.csv`. The CSV reader splits on commas, so any value containing a
> comma (the `allergens` list, or an ingredient list) will be mis-parsed.

> **Do not add plain `title` / `ingredients` / `description` columns alongside the `_ro` ones.**
> The importer applies the bare column last, so it silently overrides the `_ro` value.

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
| `image` | text | `BH-001` | Image file name without extension; defaults to the row's `sku`. Only used with `--images-dir` |
| `country_of_origin` | text | `RO` | Optional origin |

## Images

Name each image file after its product SKU (`BH-001.png`), put them all in one folder, and pass
that folder to the importer:

```bash
pnpm import:products -- products.xlsx --images-dir=product-images
```

- Accepted types: `.png`, `.jpg`, `.jpeg`, `.webp`
- The `image` column overrides the file name (without extension); leave it empty to use the SKU
- Uploads keep their file name, so the media library lists them as `BH-001.png` — easy to find by SKU
- Re-running the import reuses the existing upload (matched by file name) instead of duplicating it
- Products that already have an image are skipped; pass `--replace-images` to overwrite
- The media `alt` text is set from the product title (falling back to the SKU), since that is what
  the storefront reads out to screen readers
- Without `--images-dir`, images are ignored entirely

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

- Existing products are matched by `sku` and updated; new SKUs are created.
- Categories must exist in the admin before import if `category_slug` is used.
