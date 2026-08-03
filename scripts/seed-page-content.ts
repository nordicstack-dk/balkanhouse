import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

type Locale = 'ro' | 'da' | 'en'

// --- Lexical rich-text builders -------------------------------------------

const text = (value: string, format = 0) => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const paragraph = (children: unknown[]) => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children,
})

const heading = (value: string, tag: 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [text(value)],
})

const listItem = (value: string) => ({
  type: 'listitem',
  value: 1,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [text(value)],
})

const bulletList = (values: string[]) => ({
  type: 'list',
  tag: 'ul',
  listType: 'bullet',
  start: 1,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: values.map(listItem),
})

const root = (children: unknown[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children,
  },
})

// --- Content ---------------------------------------------------------------

type AboutContent = { title: string; nodes: unknown[] }
type ContactContent = { title: string; intro: unknown[]; body: unknown[] }
type FaqContent = { title: string; items: { question: string; answer: string }[] }

const about: Record<Locale, AboutContent> = {
  ro: {
    title: 'Despre noi',
    nodes: [
      heading('Povestea noastră'),
      paragraph([
        text(
          'Balkan House s-a născut din dorul după gusturile de acasă. Aducem în Danemarca produse românești autentice — de la conserve și dulcețuri, la mezeluri, dulciuri și băuturi tradiționale.',
        ),
      ]),
      paragraph([
        text(
          'Lucrăm direct cu producători de încredere și alegem cu grijă fiecare produs, ca tu să regăsești exact gustul pe care îl știi și îl iubești.',
        ),
      ]),
      heading('Ce ne face diferiți'),
      bulletList([
        'Produse autentice, selectate cu grijă de la producători de încredere',
        'Livrare în toată Danemarca, direct la ușa ta',
        'Suport prietenos, în limba română, ori de câte ori ai nevoie',
      ]),
      paragraph([
        text('Îți mulțumim că faci parte din familia Balkan House. Gust de acasă, oriunde ai fi.'),
      ]),
    ],
  },
  da: {
    title: 'Om os',
    nodes: [
      heading('Vores historie'),
      paragraph([
        text(
          'Balkan House er født af længslen efter smagen af hjemmet. Vi bringer autentiske rumænske produkter til Danmark — fra konserves og syltetøj til pålæg, slik og traditionelle drikkevarer.',
        ),
      ]),
      paragraph([
        text(
          'Vi samarbejder direkte med betroede producenter og udvælger hvert produkt med omhu, så du genfinder præcis den smag, du kender og elsker.',
        ),
      ]),
      heading('Det, der gør os anderledes'),
      bulletList([
        'Autentiske produkter, udvalgt med omhu fra betroede producenter',
        'Levering i hele Danmark, direkte til din dør',
        'Venlig support på dit sprog, når du har brug for det',
      ]),
      paragraph([
        text('Tak, fordi du er en del af Balkan House-familien. Smag af hjemmet, uanset hvor du er.'),
      ]),
    ],
  },
  en: {
    title: 'About us',
    nodes: [
      heading('Our story'),
      paragraph([
        text(
          'Balkan House was born from a longing for the taste of home. We bring authentic Romanian products to Denmark — from preserves and jams to cured meats, sweets and traditional drinks.',
        ),
      ]),
      paragraph([
        text(
          'We work directly with trusted producers and carefully select every product, so you can rediscover exactly the taste you know and love.',
        ),
      ]),
      heading('What makes us different'),
      bulletList([
        'Authentic products, carefully selected from trusted producers',
        'Delivery across Denmark, straight to your door',
        'Friendly support whenever you need it',
      ]),
      paragraph([
        text('Thank you for being part of the Balkan House family. A taste of home, wherever you are.'),
      ]),
    ],
  },
}

const contact: Record<Locale, ContactContent> = {
  ro: {
    title: 'Contact',
    intro: [
      paragraph([
        text(
          'Suntem aici să te ajutăm. Ai o întrebare despre o comandă, un produs sau despre livrare? Scrie-ne sau sună-ne — îți răspundem cât putem de repede.',
        ),
      ]),
    ],
    body: [
      heading('Program', 'h3'),
      paragraph([text('Luni – Vineri: 09:00 – 17:00')]),
      paragraph([text('Sâmbătă: 10:00 – 14:00')]),
      paragraph([text('Duminică: închis')]),
      heading('Timp de răspuns', 'h3'),
      paragraph([
        text('Răspundem la emailuri în aceeași zi lucrătoare, de obicei în câteva ore.'),
      ]),
    ],
  },
  da: {
    title: 'Kontakt',
    intro: [
      paragraph([
        text(
          'Vi er her for at hjælpe dig. Har du et spørgsmål om en ordre, et produkt eller om levering? Skriv eller ring til os — vi svarer så hurtigt, vi kan.',
        ),
      ]),
    ],
    body: [
      heading('Åbningstider', 'h3'),
      paragraph([text('Mandag – Fredag: 09:00 – 17:00')]),
      paragraph([text('Lørdag: 10:00 – 14:00')]),
      paragraph([text('Søndag: lukket')]),
      heading('Svartid', 'h3'),
      paragraph([text('Vi besvarer e-mails samme hverdag, som regel inden for få timer.')]),
    ],
  },
  en: {
    title: 'Contact',
    intro: [
      paragraph([
        text(
          "We're here to help. Have a question about an order, a product, or delivery? Send us a message or give us a call — we'll get back to you as soon as we can.",
        ),
      ]),
    ],
    body: [
      heading('Opening hours', 'h3'),
      paragraph([text('Monday – Friday: 09:00 – 17:00')]),
      paragraph([text('Saturday: 10:00 – 14:00')]),
      paragraph([text('Sunday: closed')]),
      heading('Response time', 'h3'),
      paragraph([text('We reply to emails the same business day, usually within a few hours.')]),
    ],
  },
}

const faq: Record<Locale, FaqContent> = {
  ro: {
    title: 'Întrebări frecvente',
    items: [
      {
        question: 'Cum funcționează o comandă?',
        answer:
          'Adaugi produsele dorite în coș și apeși „Trimite comanda”. Verificăm disponibilitatea, îți trimitem confirmarea și un link de plată. Plătești abia după ce îți confirmăm comanda.',
      },
      {
        question: 'În ce monedă sunt prețurile și cum plătesc?',
        answer:
          'Toate prețurile sunt afișate în coroane daneze (DKK). Plata se face online, printr-un link securizat, după ce îți confirmăm comanda.',
      },
      {
        question: 'Livrați în toată Danemarca?',
        answer:
          'Da, livrăm în toată Danemarca, direct la adresa ta. Detaliile și costul livrării îți sunt comunicate la confirmarea comenzii.',
      },
      {
        question: 'Pot să ridic personal comanda?',
        answer:
          'Sigur. La finalizarea comenzii poți alege „Ridicare din magazin” în locul livrării la domiciliu, iar noi îți spunem când este gata.',
      },
      {
        question: 'Când primesc confirmarea și link-ul de plată?',
        answer:
          'Primești un email de confirmare imediat ce verificăm disponibilitatea produselor — de obicei în aceeași zi lucrătoare — împreună cu link-ul de plată.',
      },
      {
        question: 'Unde găsesc informații despre ingrediente și alergeni?',
        answer:
          'Fiecare produs are lista de ingrediente și alergenii afișați pe pagina lui. Dacă ai nelămuriri, scrie-ne și te ajutăm cu drag.',
      },
      {
        question: 'Ce fac dacă am o problemă cu comanda?',
        answer:
          'Contactează-ne prin email sau telefon și rezolvăm cât mai repede. Ne dorim să fii mulțumit de fiecare comandă.',
      },
    ],
  },
  da: {
    title: 'Ofte stillede spørgsmål',
    items: [
      {
        question: 'Hvordan fungerer en bestilling?',
        answer:
          'Læg de ønskede varer i kurven og tryk „Send ordre”. Vi tjekker lagerstatus, sender dig en bekræftelse og et betalingslink. Du betaler først, når vi har bekræftet ordren.',
      },
      {
        question: 'Hvilken valuta er priserne i, og hvordan betaler jeg?',
        answer:
          'Alle priser er i danske kroner (DKK). Betaling foregår online via et sikkert link, efter vi har bekræftet din ordre.',
      },
      {
        question: 'Leverer I i hele Danmark?',
        answer:
          'Ja, vi leverer i hele Danmark, direkte til din adresse. Detaljer og leveringspris oplyses, når vi bekræfter din ordre.',
      },
      {
        question: 'Kan jeg selv hente min ordre?',
        answer:
          'Ja da. Ved kassen kan du vælge „Afhentning i butik” i stedet for levering, og så giver vi besked, når den er klar.',
      },
      {
        question: 'Hvornår modtager jeg bekræftelse og betalingslink?',
        answer:
          'Du får en bekræftelse på e-mail, så snart vi har tjekket lagerstatus — som regel samme hverdag — sammen med betalingslinket.',
      },
      {
        question: 'Hvor finder jeg information om ingredienser og allergener?',
        answer:
          'Hvert produkt har ingredienslisten og allergener angivet på produktsiden. Er du i tvivl, så skriv til os — vi hjælper gerne.',
      },
      {
        question: 'Hvad gør jeg, hvis der er et problem med min ordre?',
        answer:
          'Kontakt os på e-mail eller telefon, så løser vi det hurtigst muligt. Vi vil have, at du er tilfreds med hver ordre.',
      },
    ],
  },
  en: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'How does ordering work?',
        answer:
          "Add the products you want to your cart and click “Submit order”. We check availability, then send you a confirmation and a payment link. You only pay after we've confirmed your order.",
      },
      {
        question: 'What currency are prices in, and how do I pay?',
        answer:
          "All prices are shown in Danish kroner (DKK). Payment is made online through a secure link once we've confirmed your order.",
      },
      {
        question: 'Do you deliver across Denmark?',
        answer:
          'Yes, we deliver throughout Denmark, straight to your address. Delivery details and cost are shared when we confirm your order.',
      },
      {
        question: 'Can I pick up my order myself?',
        answer:
          "Absolutely. At checkout you can choose “Pickup in store” instead of home delivery, and we'll let you know when it's ready.",
      },
      {
        question: 'When will I receive my confirmation and payment link?',
        answer:
          "You'll get a confirmation email as soon as we've checked availability — usually the same business day — along with the payment link.",
      },
      {
        question: 'Where can I find ingredient and allergen information?',
        answer:
          "Every product lists its ingredients and allergens on its product page. If anything is unclear, just message us and we'll gladly help.",
      },
      {
        question: 'What if there is a problem with my order?',
        answer:
          "Contact us by email or phone and we'll sort it out as quickly as possible. We want you to be happy with every order.",
      },
    ],
  },
}

const LOCALES: Locale[] = ['ro', 'da', 'en']

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function run() {
  const payload = await getPayloadInstance()

  for (const locale of LOCALES) {
    await payload.updateGlobal({
      slug: 'about',
      locale,
      data: { title: about[locale].title, content: root(about[locale].nodes) as never },
    })

    await payload.updateGlobal({
      slug: 'contact',
      locale,
      data: {
        title: contact[locale].title,
        intro: root(contact[locale].intro) as never,
        body: root(contact[locale].body) as never,
      },
    })

    await payload.updateGlobal({
      slug: 'faq',
      locale,
      data: { title: faq[locale].title, items: faq[locale].items },
    })

    console.log(`Seeded About / Contact / FAQ for locale: ${locale}`)
  }
}

run()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to seed page content:', error)
    process.exit(1)
  })
