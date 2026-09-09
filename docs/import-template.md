# Product import template

This document describes the expected Excel columns for bulk product import.

> **Primary path:** Admin → **Catalog → Products** → upload the file in the import panel above the list.

> **CLI (automation / local image folders):** `pnpm import:products`

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
| `stock_status` | text | `in`, `low`, or `out` | Manual stock indicator (Romanian labels also accepted: `în stoc`, `stoc redus`, `epuizat`). **Leave empty to hide the product** — see [Hidden products](#hidden-products) |

## Optional columns

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `net_weight_g` | number | `200` | Net weight of **one pack**, in grams. Shows a reference price per kg. Aliases: `net_weight`, `weight_g`, `gramaj` |
| `net_volume_ml` | number | `1500` | Net volume of **one pack**, in millilitres. Shows a reference price per litre. Aliases: `net_volume`, `volume_ml`, `volum` |
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
| `image` | text | `BH-001` | Image file name without extension; defaults to the row's `sku` |
| `keyword` | text | `bread` | Shared related-products keyword (stored lowercase). Same keyword groups products on the product page |
| `country_of_origin` | text | `RO` | Optional origin |

## Images

Images are linked by **SKU filename** automatically:

- Saving a product with no images attaches Media (or an orphan Vercel Blob) named like the SKU
- Uploading Media named `SKU.jpg` attaches it to the matching product when that product has no image
- Excel import (Admin or CLI) does the same (empty `image` column → SKU), including blobs already in Vercel Storage

### Admin import

1. Open **Catalog → Products**
2. Choose your `.xlsx` / `.csv` in the import panel
3. Optionally check **Replace existing product images**
4. Click **Import**

### Local folder upload (CLI only)

To upload files from disk during CLI import, put them in a folder and pass `--images-dir`:

```bash
pnpm import:products -- products.xlsx --images-dir=product-images
```

- Accepted types: `.png`, `.jpg`, `.jpeg`, `.webp`
- The `image` column overrides the file name (without extension); leave it empty to use the SKU
- Uploads keep their file name, so the media library lists them as `BH-001.png` — easy to find by SKU
- Re-running the import reuses the existing upload (matched by file name) instead of duplicating it
- Products that already have an image are skipped; pass `--replace-images` (CLI) or check the Admin checkbox to overwrite
- The media `alt` text is set from the product title (falling back to the SKU), since that is what
  the storefront reads out to screen readers
- Without `--images-dir`, import still links existing Media / Vercel Blob files by SKU

### Orphan Vercel Storage files

Files uploaded only in the Vercel Blob / Storage UI are registered as Media when product save, Media
upload, or Excel import finds a matching SKU filename. Day-to-day use does not need a manual sync
button.

## Allergen codes

Use these values in the `allergens` column (comma-separated):

`gluten`, `crustaceans`, `eggs`, `fish`, `peanuts`, `soybeans`, `milk`, `nuts`, `celery`, `mustard`, `sesame`, `sulphites`, `lupin`, `molluscs`

### Accepted alternatives

Romanian and Danish names are accepted too, with or without diacritics, so you can type what is
on the label. Duplicates across spellings are collapsed (`milk,lapte` → one entry).

| Code | Also accepted |
|------|---------------|
| `gluten` | — |
| `crustaceans` | `crustacee`, `krebsdyr` |
| `eggs` | `egg`, `ou`, `ouă`, `æg` |
| `fish` | `pește`, `fisk` |
| `peanuts` | `peanut`, `arahide`, `jordnødder` |
| `soybeans` | `soy`, `soybean`, `soia`, `soja`, `sojabønner` |
| `milk` | `lapte`, `lactoză`, `laktose`, `mælk` |
| `nuts` | `nuci`, `fructe cu coajă`, `nødder` |
| `celery` | `țelină`, `selleri` |
| `mustard` | `muștar`, `sennep` |
| `sesame` | `susan`, `sesam` |
| `sulphites` | `sulfites`, `sulfiți`, `sulfitter`, `so2`, `dioxid de sulf` |
| `lupin` | `lupine` |
| `molluscs` | `mollusks`, `moluște`, `bløddyr`, `muslinger` |

**No allergens:** leave the cell empty, or write any of `none`, `no`, `n/a`, `na`, `-`, `0`, `nu`,
`niciunul`, `nici unul`, `fără`, `fără alergeni`, `ingen`. All of these mean "no allergens".

**Deliberately not accepted:** ambiguous words are rejected rather than guessed, because a wrong
allergen is a safety problem. `alune` is hazelnuts in most of Romania but peanuts in *alune de
pământ*; `scoici` spans both molluscs and crustaceans. Write the specific code for these.

> **Careful:** a blank `allergens` cell **clears** any allergens already saved on that product.
> If you are only updating prices, delete the whole column from the sheet rather than leaving it
> empty.

## When a row is rejected

Import is all-or-nothing: a single invalid cell aborts the whole file before anything is written.
The error names the row as it is numbered in Excel, e.g.

```
Row 4: Invalid allergen "alune". Use an EU code (gluten, crustaceans, …), a known local name, or leave the cell empty.
Row 12: Invalid unit "litru"
Row 88: invalid net_weight_g "abc"
```

Fix that row and run the import again. Use `--dry-run` (CLI) or read the Admin import preview to
catch these before writing anything.

## Stock status values

| Value | Meaning |
|-------|---------|
| `in` | In stock |
| `low` | Low stock |
| `out` | Out of stock — still listed, marked sold out |
| *(empty)* | **Hidden** — the product does not appear in the shop at all |

### Hidden products

A product with **no stock status** is treated as not published. It is:

- not listed on `/shop` or in any category
- not returned by search or filtering
- not offered as a related product, and not shown on the offers page or home carousel even if a
  promotion links it
- not reachable at `/produs/<SKU>` (that URL returns 404)
- not orderable — a stale cart containing it is rejected at checkout

It stays fully visible and editable in the admin, so this is the state to use for a product that
is not ready to sell yet. To publish it, give it a stock status.

Two consequences for imports:

- Leaving `stock_status` empty **takes the product off the storefront**. It does not default to
  "in stock".
- Because of that, a blank cell no longer silently puts an `epuizat` product back on sale — but it
  does hide it. If you only want to update prices, either fill in `stock_status` for every row or
  delete the column entirely from that sheet.

Run a `--dry-run` (or read the Admin import preview) first: rows that would be hidden are listed
as `ascuns (nu apare în magazin)`.

## Pack size and the reference price

`price_dkk` is always the price charged for one sellable unit — one pack, or one kilogram for
`unit = kg` products. Neither pack-size column ever changes it.

Fill in **exactly one** of the two, whichever the product is sold by:

| Column | Shows | Use for |
|--------|-------|---------|
| `net_weight_g` | price per **kg** | jars, packs, cheese, meats, flour, sweets |
| `net_volume_ml` | price per **litre** | water, juice, oil, vinegar, spirits |

```
200 g · 59,75 kr./kg      <- derived from 11,95 ÷ 0,2
11,95 kr.                 <- what the customer pays

1,5 l · 9,98 kr./l        <- derived from 14,97 ÷ 1,5
14,97 kr.
```

- Both figures are calculated on every render, never stored, so they cannot drift from the price.
- They follow any active promotion, so the reference always matches what is charged.
- The pack size is nominal. Goods weighed at packing will vary slightly from it.
- A blank cell leaves any value already set in the admin untouched (same as `keyword` and
  `category_slug`).

### Weight and volume are not interchangeable

A litre is a measure of space and a kilogram a measure of weight; they only coincide for water.
A litre of sunflower oil weighs about 920 g, so a 1 L bottle at 23,32 kr is **23,32 kr/l** but
**25,35 kr/kg**. EU price marking uses litres for liquids and kilograms for solids, so the shop
keeps them apart rather than converting between them.

For solids packed in brine, use the **drained weight** in `net_weight_g` — a 720 ml jar of
roasted peppers with 400 g drained is `net_weight_g = 400`, not `net_volume_ml = 720`. The
customer is buying peppers, not liquid.

### Rejected combinations

Both the importer and the admin refuse these, because each one silently mis-prices a product:

| Combination | Why it is refused |
|---|---|
| `unit = kg` **plus** a pack size | `price_dkk` is already the price of one kilogram there. A pack size means the price was probably entered as a *pack* price — which undercharges on every sale. For a fixed-weight pack use `unit = piece` with the pack price. |
| `net_weight_g` **and** `net_volume_ml` together | A product is sold by one or the other, and the two cannot be converted. |

Leave both columns empty for `unit = kg` products, and for anything not sold by weight or volume
(eggs, tea bags, food colouring). Empty simply means no reference line — nothing breaks.

## CLI usage

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
