/**
 * Localized copy for transactional order emails (RO / DA / EN).
 *
 * Interpolated values (customer name, order number) are passed in already
 * escaped where they land in HTML, so the strings here are plain text.
 * Falls back to Romanian for any unknown/missing locale.
 */
import { routing } from '@/i18n/routing'

export type EmailMessages = {
  lang: string
  layoutTagline: string
  common: {
    orderNumber: string
    shippingMethod: string
    pickup: string
    delivery: string
    unitPiece: string
    unitKg: string
    tableProduct: string
    tableQty: string
    tablePrice: string
    tableTotal: string
    orderTotal: string
    adjustedBadge: string
    adjustmentsNotice: string
  }
  received: {
    subject: (orderNumber: string) => string
    heading: (firstName: string) => string
    body: string
    followup: string
  }
  paymentLink: {
    subject: (orderNumber: string) => string
    heading: (firstName: string) => string
    body: string
    button: string
    fallback: string
  }
  paymentConfirmed: {
    subject: (orderNumber: string) => string
    heading: string
    body: (name: string) => string
    readyDelivery: string
    readyPickup: string
  }
  shipped: {
    subjectDelivery: (orderNumber: string) => string
    subjectPickup: (orderNumber: string) => string
    headingDelivery: string
    headingPickup: string
    bodyDelivery: (firstName: string, orderNumber: string) => string
    bodyPickup: (firstName: string, orderNumber: string) => string
    tracking: string
  }
  cancelled: {
    subject: (orderNumber: string) => string
    heading: string
    body: (firstName: string, orderNumber: string) => string
    followup: string
  }
}

const ro: EmailMessages = {
  lang: 'ro',
  layoutTagline: 'Balkan House · Produse balcanice de calitate',
  common: {
    orderNumber: 'Număr comandă',
    shippingMethod: 'Metodă de livrare',
    pickup: 'Ridicare din magazin',
    delivery: 'Livrare la domiciliu',
    unitPiece: 'buc',
    unitKg: 'kg',
    tableProduct: 'Produs',
    tableQty: 'Cant.',
    tablePrice: 'Preț',
    tableTotal: 'Total',
    orderTotal: 'Total comandă',
    adjustedBadge: 'Ajustat de magazin',
    adjustmentsNotice: 'Cantitate/preț actualizat de magazin pentru unele produse din comandă.',
  },
  received: {
    subject: (n) => `Comanda ${n} a fost primită — Balkan House`,
    heading: (f) => `Mulțumim, ${f}!`,
    body: 'Am primit comanda ta și o verificăm. Vei primi un link de plată pe email după confirmare.',
    followup: 'Te contactăm dacă avem nevoie de detalii suplimentare.',
  },
  paymentLink: {
    subject: (n) => `Link de plată — comanda ${n}`,
    heading: (f) => `Salut, ${f}!`,
    body: 'Comanda ta a fost confirmată. Poți plăti acum folosind linkul de mai jos.',
    button: 'Plătește acum',
    fallback: 'Dacă butonul nu funcționează, copiază acest link în browser:',
  },
  paymentConfirmed: {
    subject: (n) => `Plata confirmată — comanda ${n}`,
    heading: 'Plata a fost primită!',
    body: (name) => `Mulțumim, ${name}. Am înregistrat plata pentru comanda ta.`,
    readyDelivery: 'Te anunțăm când comanda este expediată.',
    readyPickup: 'Te anunțăm când comanda este pregătită pentru ridicare din magazin.',
  },
  shipped: {
    subjectDelivery: (n) => `Comanda ${n} a fost expediată`,
    subjectPickup: (n) => `Comanda ${n} este gata de ridicare`,
    headingDelivery: 'Comanda ta este pe drum!',
    headingPickup: 'Comanda ta este gata de ridicare!',
    bodyDelivery: (f, n) => `Salut, ${f}. Comanda ${n} a fost expediată.`,
    bodyPickup: (f, n) => `Salut, ${f}. Comanda ${n} te așteaptă la magazin.`,
    tracking: 'Număr de urmărire:',
  },
  cancelled: {
    subject: (n) => `Comanda ${n} a fost anulată`,
    heading: 'Comandă anulată',
    body: (f, n) => `Salut, ${f}. Comanda ${n} a fost anulată.`,
    followup: 'Dacă ai întrebări, răspunde la acest email sau contactează-ne.',
  },
}

const da: EmailMessages = {
  lang: 'da',
  layoutTagline: 'Balkan House · Kvalitetsprodukter fra Balkan',
  common: {
    orderNumber: 'Ordrenummer',
    shippingMethod: 'Leveringsmetode',
    pickup: 'Afhentning i butikken',
    delivery: 'Levering til adressen',
    unitPiece: 'stk',
    unitKg: 'kg',
    tableProduct: 'Produkt',
    tableQty: 'Antal',
    tablePrice: 'Pris',
    tableTotal: 'I alt',
    orderTotal: 'Ordre i alt',
    adjustedBadge: 'Justeret af butikken',
    adjustmentsNotice: 'Antal/pris opdateret af butikken for nogle varer i ordren.',
  },
  received: {
    subject: (n) => `Ordre ${n} er modtaget — Balkan House`,
    heading: (f) => `Tak, ${f}!`,
    body: 'Vi har modtaget din ordre og gennemgår den. Du modtager et betalingslink på e-mail, når den er bekræftet.',
    followup: 'Vi kontakter dig, hvis vi har brug for flere oplysninger.',
  },
  paymentLink: {
    subject: (n) => `Betalingslink — ordre ${n}`,
    heading: (f) => `Hej, ${f}!`,
    body: 'Din ordre er bekræftet. Du kan betale nu via linket nedenfor.',
    button: 'Betal nu',
    fallback: 'Hvis knappen ikke virker, kopiér dette link ind i din browser:',
  },
  paymentConfirmed: {
    subject: (n) => `Betaling bekræftet — ordre ${n}`,
    heading: 'Betalingen er modtaget!',
    body: (name) => `Tak, ${name}. Vi har registreret betalingen for din ordre.`,
    readyDelivery: 'Vi giver dig besked, når ordren er afsendt.',
    readyPickup: 'Vi giver dig besked, når ordren er klar til afhentning i butikken.',
  },
  shipped: {
    subjectDelivery: (n) => `Ordre ${n} er afsendt`,
    subjectPickup: (n) => `Ordre ${n} er klar til afhentning`,
    headingDelivery: 'Din ordre er på vej!',
    headingPickup: 'Din ordre er klar til afhentning!',
    bodyDelivery: (f, n) => `Hej, ${f}. Ordre ${n} er blevet afsendt.`,
    bodyPickup: (f, n) => `Hej, ${f}. Ordre ${n} venter på dig i butikken.`,
    tracking: 'Sporingsnummer:',
  },
  cancelled: {
    subject: (n) => `Ordre ${n} er annulleret`,
    heading: 'Ordre annulleret',
    body: (f, n) => `Hej, ${f}. Ordre ${n} er blevet annulleret.`,
    followup: 'Har du spørgsmål, så svar på denne e-mail eller kontakt os.',
  },
}

const en: EmailMessages = {
  lang: 'en',
  layoutTagline: 'Balkan House · Quality Balkan products',
  common: {
    orderNumber: 'Order number',
    shippingMethod: 'Shipping method',
    pickup: 'Pickup in store',
    delivery: 'Home delivery',
    unitPiece: 'pcs',
    unitKg: 'kg',
    tableProduct: 'Product',
    tableQty: 'Qty',
    tablePrice: 'Price',
    tableTotal: 'Total',
    orderTotal: 'Order total',
    adjustedBadge: 'Adjusted by store',
    adjustmentsNotice: 'Quantity/price updated by the store for some items in the order.',
  },
  received: {
    subject: (n) => `Order ${n} received — Balkan House`,
    heading: (f) => `Thank you, ${f}!`,
    body: "We've received your order and are reviewing it. You'll get a payment link by email once it's confirmed.",
    followup: "We'll contact you if we need any more details.",
  },
  paymentLink: {
    subject: (n) => `Payment link — order ${n}`,
    heading: (f) => `Hi, ${f}!`,
    body: 'Your order has been confirmed. You can pay now using the link below.',
    button: 'Pay now',
    fallback: "If the button doesn't work, copy this link into your browser:",
  },
  paymentConfirmed: {
    subject: (n) => `Payment confirmed — order ${n}`,
    heading: 'Payment received!',
    body: (name) => `Thank you, ${name}. We've recorded the payment for your order.`,
    readyDelivery: "We'll let you know when your order has been shipped.",
    readyPickup: "We'll let you know when your order is ready for pickup in store.",
  },
  shipped: {
    subjectDelivery: (n) => `Order ${n} has been shipped`,
    subjectPickup: (n) => `Order ${n} is ready for pickup`,
    headingDelivery: 'Your order is on its way!',
    headingPickup: 'Your order is ready for pickup!',
    bodyDelivery: (f, n) => `Hi, ${f}. Order ${n} has been shipped.`,
    bodyPickup: (f, n) => `Hi, ${f}. Order ${n} is waiting for you in store.`,
    tracking: 'Tracking number:',
  },
  cancelled: {
    subject: (n) => `Order ${n} has been cancelled`,
    heading: 'Order cancelled',
    body: (f, n) => `Hi, ${f}. Order ${n} has been cancelled.`,
    followup: 'If you have any questions, reply to this email or contact us.',
  },
}

const MESSAGES: Record<string, EmailMessages> = { ro, da, en }

export function emailMessages(locale?: string | null): EmailMessages {
  if (locale && locale in MESSAGES) {
    return MESSAGES[locale]
  }
  return MESSAGES[routing.defaultLocale] ?? ro
}
