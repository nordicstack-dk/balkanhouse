import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import type { AllergenEU, StockStatus, Unit } from '../src/lib/contracts/index.js'
import { ALLERGEN_EU, STOCK_STATUS, UNIT } from '../src/lib/contracts/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

type Locale = 'ro' | 'da' | 'en'
const LOCALES: Locale[] = ['ro', 'da', 'en']

interface CategorySeed {
  slug: string
  name: Record<Locale, string>
}

interface ProductSeed {
  sku: string
  title: Record<Locale, string>
  categorySlug: string
  priceDkk: number
  unit: Unit
  stockStatus: StockStatus
  allergens?: AllergenEU[]
  ingredients: Record<Locale, string>
  description: Record<Locale, string>
  countryOfOrigin?: string
}

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    slug: 'conserve',
    name: {
      ro: 'Conserve',
      da: 'Konserves',
      en: 'Preserves',
    },
  },
  {
    slug: 'mezeluri',
    name: {
      ro: 'Mezeluri',
      da: 'Pålæg & kød',
      en: 'Charcuterie',
    },
  },
  {
    slug: 'bauturi',
    name: {
      ro: 'Băuturi',
      da: 'Drikkevarer',
      en: 'Beverages',
    },
  },
  {
    slug: 'dulciuri',
    name: {
      ro: 'Dulciuri',
      da: 'Slik & sager',
      en: 'Sweets',
    },
  },
  {
    slug: 'paine-si-produse-de-panificatie',
    name: {
      ro: 'Pâine și produse de panificație',
      da: 'Brød & bagværk',
      en: 'Bread & bakery',
    },
  },
]

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    sku: 'BH-001',
    title: {
      ro: 'Zacuscă de vinete',
      da: 'Aubergine-zacusca',
      en: 'Eggplant zacusca',
    },
    categorySlug: 'conserve',
    priceDkk: 32.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SULPHITES],
    ingredients: {
      ro: 'Vinete (65%), ardei gras, ceapă, ulei de floarea-soarelui, sare, piper, condimente',
      da: 'Auberginer (65%), peberfrugt, løg, solsikkeolie, salt, peber, krydderier',
      en: 'Eggplant (65%), bell pepper, onion, sunflower oil, salt, pepper, spices',
    },
    description: {
      ro: 'Zacuscă tradițională românească, perfectă cu pâine proaspătă sau ca garnitură.',
      da: 'Traditionel rumænsk aubergine-zacusca — perfekt til frisk brød eller som tilbehør.',
      en: 'Traditional Romanian eggplant zacusca — perfect with fresh bread or as a side.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-002',
    title: {
      ro: 'Salam de Sibiu',
      da: 'Sibiu-salami',
      en: 'Sibiu salami',
    },
    categorySlug: 'mezeluri',
    priceDkk: 45.9,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SULPHITES],
    ingredients: {
      ro: 'Carne de porc, sare, condimente naturale, dextroză',
      da: 'Svinekød, salt, naturlige krydderier, dextrose',
      en: 'Pork meat, salt, natural spices, dextrose',
    },
    description: {
      ro: 'Salam afumat de Sibiu — rețetă clasică, savurat de generații întregi.',
      da: 'Røget Sibiu-salami — klassisk opskrift elsket i generationer.',
      en: 'Smoked Sibiu salami — a classic recipe loved for generations.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-003',
    title: {
      ro: 'Borș instant',
      da: 'Instant borsh',
      en: 'Instant borsh',
    },
    categorySlug: 'conserve',
    priceDkk: 18.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.LOW,
    ingredients: {
      ro: 'Concentrat de borș (acru de borș), sare, extract de legume',
      da: 'Borsh-koncentrat, salt, grøntsagsekstrakt',
      en: 'Borsh concentrate, salt, vegetable extract',
    },
    description: {
      ro: 'Borș instant pentru ciorbe autentice — doar adaugă apă și legume.',
      da: 'Instant borsh til autentiske supper — tilsæt bare vand og grøntsager.',
      en: 'Instant borsh for authentic soups — just add water and vegetables.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-004',
    title: {
      ro: 'Gem de prune',
      da: 'Blommemarmelade',
      en: 'Plum jam',
    },
    categorySlug: 'dulciuri',
    priceDkk: 28.0,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SULPHITES],
    ingredients: {
      ro: 'Prune (55%), zahăr, agent de îngroșare (pektină), acid citric',
      da: 'Blommer (55%), sukker, fortykningsmiddel (pektin), citronsyre',
      en: 'Plums (55%), sugar, thickener (pectin), citric acid',
    },
    description: {
      ro: 'Gem dens de prune din livada Argeșului — dulceață de casă.',
      da: 'Tæt blommemarmelade fra Argeș — hjemmelavet sødme.',
      en: 'Thick plum jam from Argeș orchards — homemade sweetness.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-005',
    title: {
      ro: 'Mămăligă instant',
      da: 'Instant mămăligă',
      en: 'Instant mămăligă',
    },
    categorySlug: 'paine-si-produse-de-panificatie',
    priceDkk: 22.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.GLUTEN],
    ingredients: {
      ro: 'Mălai de porumb 100%',
      da: 'Majsmehl 100%',
      en: '100% cornmeal',
    },
    description: {
      ro: 'Mămăligă gata în 3 minute — baza oricărei mese românești.',
      da: 'Mămăligă klar på 3 minutter — grundlaget for enhver rumænsk middag.',
      en: 'Mămăligă ready in 3 minutes — the base of any Romanian meal.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-006',
    title: {
      ro: 'Ciocolată Rom',
      da: 'Rom-chokolade',
      en: 'Rom chocolate',
    },
    categorySlug: 'dulciuri',
    priceDkk: 15.95,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.MILK, ALLERGEN_EU.NUTS],
    ingredients: {
      ro: 'Zahăr, unt de cacao, lapte praf, alune de pădure, emulsifiant (lecitină de soia)',
      da: 'Sukker, kakaosmør, mælkepulver, hasselnødder, emulgator (sojalecithin)',
      en: 'Sugar, cocoa butter, milk powder, hazelnuts, emulsifier (soy lecithin)',
    },
    description: {
      ro: 'Ciocolată cu alune Rom — nostalgie dulce din copilărie.',
      da: 'Rom-chokolade med hasselnødder — sød barndomsnostalgi.',
      en: 'Rom hazelnut chocolate — sweet childhood nostalgia.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-007',
    title: {
      ro: 'Țuică de prune 0.5L',
      da: 'Blommeschnaps 0,5L',
      en: 'Plum brandy 0.5L',
    },
    categorySlug: 'bauturi',
    priceDkk: 89.0,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.LOW,
    ingredients: {
      ro: 'Țuică de prune (alcool 50% vol.)',
      da: 'Blommeschnaps (alkohol 50% vol.)',
      en: 'Plum brandy (alcohol 50% vol.)',
    },
    description: {
      ro: 'Țuică tradițională de prune — pentru sărbători și pofte românești.',
      da: 'Traditionel blommeschnaps — til højtider og rumænske cravings.',
      en: 'Traditional plum brandy — for celebrations and Romanian cravings.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-008',
    title: {
      ro: 'Pastramă de oaie',
      da: 'Lammepastrami',
      en: 'Lamb pastrami',
    },
    categorySlug: 'mezeluri',
    priceDkk: 125.0,
    unit: UNIT.KG,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SULPHITES],
    ingredients: {
      ro: 'Carne de oaie, sare, condimente, usturoi',
      da: 'Lammekød, salt, krydderier, hvidløg',
      en: 'Lamb meat, salt, spices, garlic',
    },
    description: {
      ro: 'Pastramă afumată de oaie — delicatesă pentru mesele de sărbătoare.',
      da: 'Røget lammepastrami — en delikatesse til festmåltider.',
      en: 'Smoked lamb pastrami — a delicacy for festive tables.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-009',
    title: {
      ro: 'Brânză de burduf',
      da: 'Burduf-ost',
      en: 'Burduf cheese',
    },
    categorySlug: 'conserve',
    priceDkk: 55.0,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.OUT,
    allergens: [ALLERGEN_EU.MILK],
    ingredients: {
      ro: 'Brânză de vaci maturată, sare, condimente, coajă de brad',
      da: 'Modnet kvark, salt, krydderier, grankåd',
      en: 'Matured cottage cheese, salt, spices, fir bark',
    },
    description: {
      ro: 'Brânză de burduf în coajă de brad — aromă intensă din Carpați.',
      da: 'Burduf-ost i grankåd — intens aroma fra Karpaterne.',
      en: 'Burduf cheese in fir bark — intense Carpathian flavour.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-010',
    title: {
      ro: 'Pâine Boromir feliată',
      da: 'Boromir skiveskåret brød',
      en: 'Boromir sliced bread',
    },
    categorySlug: 'paine-si-produse-de-panificatie',
    priceDkk: 19.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.GLUTEN],
    ingredients: {
      ro: 'Făină de grâu, apă, drojdie, sare, zahăr',
      da: 'Hvedemel, vand, gær, salt, sukker',
      en: 'Wheat flour, water, yeast, salt, sugar',
    },
    description: {
      ro: 'Pâine albă feliată Boromir — moale și perfectă pentru sandvișuri.',
      da: 'Boromir skiveskåret hvidt brød — blødt og perfekt til sandwiches.',
      en: 'Boromir sliced white bread — soft and perfect for sandwiches.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-011',
    title: {
      ro: 'Ciorbă de perișoare (conservă)',
      da: 'Kødbollesuppe på dåse',
      en: 'Meatball soup (canned)',
    },
    categorySlug: 'conserve',
    priceDkk: 24.9,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.GLUTEN, ALLERGEN_EU.EGGS],
    ingredients: {
      ro: 'Apă, perișoare (carne de porc, orez, ou), legume, borș, condimente',
      da: 'Vand, kødboller (svinekød, ris, æg), grøntsager, borsh, krydderier',
      en: 'Water, meatballs (pork, rice, egg), vegetables, borsh, spices',
    },
    description: {
      ro: 'Ciorbă de perișoare gata preparată — gust de acasă în 5 minute.',
      da: 'Færdig kødbollesuppe — hjemmesmag på 5 minutter.',
      en: 'Ready-made meatball soup — homestyle taste in 5 minutes.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-012',
    title: {
      ro: 'Halva cu vanilie Rahat Lukum',
      da: 'Vaniljehalva Rahat Lukum',
      en: 'Vanilla halva Rahat Lukum',
    },
    categorySlug: 'dulciuri',
    priceDkk: 32.0,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SESAME, ALLERGEN_EU.NUTS],
    ingredients: {
      ro: 'Pastă de susan, zahăr, sirop de glucoză, arome naturale de vanilie',
      da: 'Sesampasta, sukker, glukosesirup, naturlige vanillearomaer',
      en: 'Sesame paste, sugar, glucose syrup, natural vanilla flavours',
    },
    description: {
      ro: 'Halva cu vanilie — desert oriental adorat la cafea.',
      da: 'Vaniljehalva — orientalsk dessert elsket til kaffen.',
      en: 'Vanilla halva — an oriental dessert loved with coffee.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-013',
    title: {
      ro: 'Lapte bătut Borsec',
      da: 'Borsec kærnemælk',
      en: 'Borsec buttermilk',
    },
    categorySlug: 'bauturi',
    priceDkk: 16.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.MILK],
    ingredients: {
      ro: 'Lapte bătut (iaurt lichid), culturi lactice vii',
      da: 'Kærnemælk, levende mælkesyrekulturer',
      en: 'Buttermilk, live lactic cultures',
    },
    description: {
      ro: 'Lapte bătut Borsec — ideal pentru ciorbe, mămăligă sau băut rece.',
      da: 'Borsec kærnemælk — ideel til supper, mămăligă eller kold.',
      en: 'Borsec buttermilk — ideal for soups, mămăligă, or chilled.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-014',
    title: {
      ro: 'Covrigi cu susan',
      da: 'Sesamkringle',
      en: 'Sesame pretzels',
    },
    categorySlug: 'paine-si-produse-de-panificatie',
    priceDkk: 12.95,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.LOW,
    allergens: [ALLERGEN_EU.GLUTEN, ALLERGEN_EU.SESAME],
    ingredients: {
      ro: 'Făină de grâu, apă, sare, susan, drojdie',
      da: 'Hvedemel, vand, salt, sesam, gær',
      en: 'Wheat flour, water, salt, sesame, yeast',
    },
    description: {
      ro: 'Covrigi crocanți cu susan — snack-ul perfect pe drum.',
      da: 'Sprøde sesamkringle — den perfekte snack på farten.',
      en: 'Crunchy sesame pretzels — the perfect on-the-go snack.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-015',
    title: {
      ro: 'Muschi file afumat',
      da: 'Røget svinefilet',
      en: 'Smoked pork tenderloin',
    },
    categorySlug: 'mezeluri',
    priceDkk: 149.0,
    unit: UNIT.KG,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SULPHITES],
    ingredients: {
      ro: 'Mușchi de porc, sare, condimente, fum natural de fag',
      da: 'Svinefilet, salt, krydderier, naturlig bøge-røg',
      en: 'Pork tenderloin, salt, spices, natural beech smoke',
    },
    description: {
      ro: 'Mușchi file afumat — feliat subțire, excelent la platouri.',
      da: 'Røget svinefilet — tyndtskåret, fremragende på fade.',
      en: 'Smoked pork tenderloin — thinly sliced, excellent on platters.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-016',
    title: {
      ro: 'Fasole bătută',
      da: 'Mosbønner',
      en: 'Mashed beans',
    },
    categorySlug: 'conserve',
    priceDkk: 21.0,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.OUT,
    ingredients: {
      ro: 'Fasole boabe (80%), apă, sare, condimente',
      da: 'Bønner (80%), vand, salt, krydderier',
      en: 'Beans (80%), water, salt, spices',
    },
    description: {
      ro: 'Fasole bătută tradițională — rapidă și sățioasă cu ceapă prăjită.',
      da: 'Traditionel mosbønner — hurtig og mættende med stegte løg.',
      en: 'Traditional mashed beans — quick and hearty with fried onions.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-017',
    title: {
      ro: 'Apă minerală Pelină',
      da: 'Pelină mineralvand',
      en: 'Pelină mineral water',
    },
    categorySlug: 'bauturi',
    priceDkk: 14.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    ingredients: {
      ro: 'Apă minerală naturală carbogazoasă',
      da: 'Naturligt kulsyreholdigt mineralvand',
      en: 'Natural carbonated mineral water',
    },
    description: {
      ro: 'Apă minerală Pelină — răcoritoare și ușor amăruie, din Harghita.',
      da: 'Pelină mineralvand — forfriskende og let bittert fra Harghita.',
      en: 'Pelină mineral water — refreshing and lightly bitter from Harghita.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-018',
    title: {
      ro: 'Nuga cu alune',
      da: 'Hasselnødde-nougat',
      en: 'Hazelnut nougat',
    },
    categorySlug: 'dulciuri',
    priceDkk: 26.9,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.MILK, ALLERGEN_EU.NUTS, ALLERGEN_EU.EGGS],
    ingredients: {
      ro: 'Zahăr, alune de pădure, sirop de glucoză, albuș de ou, lapte praf',
      da: 'Sukker, hasselnødder, glukosesirup, æggehvide, mælkepulver',
      en: 'Sugar, hazelnuts, glucose syrup, egg white, milk powder',
    },
    description: {
      ro: 'Nuga cu alune — baton crocant care aduce aminte de piața din copilărie.',
      da: 'Hasselnødde-nougat — sprød bar der minder om barndommens marked.',
      en: 'Hazelnut nougat bar — a crunchy childhood market favourite.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-019',
    title: {
      ro: 'Mujdei de usturoi',
      da: 'Hvidløgssauce',
      en: 'Garlic sauce',
    },
    categorySlug: 'conserve',
    priceDkk: 27.5,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    allergens: [ALLERGEN_EU.SULPHITES],
    ingredients: {
      ro: 'Usturoi (40%), ulei de floarea-soarelui, oțet, sare, condimente',
      da: 'Hvidløg (40%), solsikkeolie, eddike, salt, krydderier',
      en: 'Garlic (40%), sunflower oil, vinegar, salt, spices',
    },
    description: {
      ro: 'Mujdei gata preparat — secretul grătarelor românești din Danemarca.',
      da: 'Færdig hvidløgssauce — hemmeligheden bag rumænske grillfester i Danmark.',
      en: 'Ready-made garlic sauce — the secret of Romanian barbecues in Denmark.',
    },
    countryOfOrigin: 'Romania',
  },
  {
    sku: 'BH-020',
    title: {
      ro: 'Cozonac cu nucă',
      da: 'Valnødde-cozonac',
      en: 'Walnut cozonac',
    },
    categorySlug: 'paine-si-produse-de-panificatie',
    priceDkk: 68.0,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.LOW,
    allergens: [ALLERGEN_EU.GLUTEN, ALLERGEN_EU.EGGS, ALLERGEN_EU.MILK, ALLERGEN_EU.NUTS],
    ingredients: {
      ro: 'Făină de grâu, ouă, zahăr, nucă, lapte, drojdie, unt, cacao',
      da: 'Hvedemel, æg, sukker, valnødder, mælk, gær, smør, kakao',
      en: 'Wheat flour, eggs, sugar, walnuts, milk, yeast, butter, cocoa',
    },
    description: {
      ro: 'Cozonac pufos cu nucă — nelipsit de Paște și Crăciun.',
      da: 'Luftig valnødde-cozonac — uundværlig til påske og jul.',
      en: 'Fluffy walnut cozonac — essential for Easter and Christmas.',
    },
    countryOfOrigin: 'Romania',
  },
]

function toRichText(text: string) {
  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', text, version: 1 }],
        },
      ],
    },
  }
}

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function seedCategories(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
): Promise<Map<string, number>> {
  const slugToId = new Map<string, number>()

  const existing = await payload.find({
    collection: 'categories',
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    const all = await payload.find({
      collection: 'categories',
      locale: 'ro',
      limit: 100,
    })

    for (const doc of all.docs) {
      if (typeof doc.slug === 'string' && typeof doc.id === 'number') {
        slugToId.set(doc.slug, doc.id)
      }
    }

    console.log(`Categories already exist (${existing.totalDocs}) — using existing`)
    return slugToId
  }

  console.log('No categories found — creating seed categories')

  for (const seed of CATEGORY_SEEDS) {
    const created = await payload.create({
      collection: 'categories',
      data: {
        name: seed.name.ro,
        slug: seed.slug,
      },
      locale: 'ro',
    })

    for (const locale of LOCALES) {
      if (locale === 'ro') {
        continue
      }

      await payload.update({
        collection: 'categories',
        id: created.id,
        data: {
          name: seed.name[locale],
          slug: seed.slug,
        },
        locale,
      })
    }

    slugToId.set(seed.slug, created.id)
    console.log(`  Category: ${seed.name.ro} (${seed.slug})`)
  }

  return slugToId
}

async function seedProducts(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  categoryMap: Map<string, number>,
): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = []
  const skipped: string[] = []

  for (const seed of PRODUCT_SEEDS) {
    const existing = await payload.find({
      collection: 'products',
      where: {
        sku: {
          equals: seed.sku,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      skipped.push(seed.sku)
      console.log(`  Skipped (exists): ${seed.sku} — ${seed.title.ro}`)
      continue
    }

    const categoryId = categoryMap.get(seed.categorySlug)

    const createdDoc = await payload.create({
      collection: 'products',
      data: {
        sku: seed.sku,
        title: seed.title.ro,
        priceDkk: seed.priceDkk,
        unit: seed.unit,
        stockStatus: seed.stockStatus,
        allergens: seed.allergens ?? [],
        countryOfOrigin: seed.countryOfOrigin,
        ingredients: seed.ingredients.ro,
        description: toRichText(seed.description.ro),
        ...(categoryId ? { category: categoryId } : {}),
      },
      locale: 'ro',
    })

    for (const locale of LOCALES) {
      if (locale === 'ro') {
        continue
      }

      await payload.update({
        collection: 'products',
        id: createdDoc.id,
        data: {
          title: seed.title[locale],
          ingredients: seed.ingredients[locale],
          description: toRichText(seed.description[locale]),
        },
        locale,
      })
    }

    created.push(seed.sku)
    console.log(`  Created: ${seed.sku} — ${seed.title.ro}`)
  }

  return { created, skipped }
}

async function seedProductsScript(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  const payload = await getPayloadInstance()

  console.log('Seeding categories...')
  const categoryMap = await seedCategories(payload)

  console.log('Seeding products...')
  const { created, skipped } = await seedProducts(payload, categoryMap)

  console.log('')
  console.log('=== Summary ===')
  console.log(`Categories: ${[...categoryMap.keys()].join(', ')}`)
  console.log(`Products created (${created.length}): ${created.join(', ') || 'none'}`)
  if (skipped.length > 0) {
    console.log(`Products skipped (${skipped.length}): ${skipped.join(', ')}`)
  }
}

seedProductsScript()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to seed products:', error)
    process.exit(1)
  })
