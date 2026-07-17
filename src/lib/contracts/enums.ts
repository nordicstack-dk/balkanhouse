export const ORDER_STATUS = {
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAID: 'paid',
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: 'Awaiting confirmation', value: ORDER_STATUS.AWAITING_CONFIRMATION },
  { label: 'Awaiting payment', value: ORDER_STATUS.AWAITING_PAYMENT },
  { label: 'Paid', value: ORDER_STATUS.PAID },
  { label: 'Shipped', value: ORDER_STATUS.SHIPPED },
  { label: 'Cancelled', value: ORDER_STATUS.CANCELLED },
]

export const STOCK_STATUS = {
  IN: 'in',
  LOW: 'low',
  OUT: 'out',
} as const

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

export const STOCK_STATUS_OPTIONS: { label: string; value: StockStatus }[] = [
  { label: 'În stoc', value: STOCK_STATUS.IN },
  { label: 'Stoc redus', value: STOCK_STATUS.LOW },
  { label: 'Epuizat', value: STOCK_STATUS.OUT },
]

export const ALLERGEN_EU = {
  GLUTEN: 'gluten',
  CRUSTACEANS: 'crustaceans',
  EGGS: 'eggs',
  FISH: 'fish',
  PEANUTS: 'peanuts',
  SOYBEANS: 'soybeans',
  MILK: 'milk',
  NUTS: 'nuts',
  CELERY: 'celery',
  MUSTARD: 'mustard',
  SESAME: 'sesame',
  SULPHITES: 'sulphites',
  LUPIN: 'lupin',
  MOLLUSCS: 'molluscs',
} as const

export type AllergenEU = (typeof ALLERGEN_EU)[keyof typeof ALLERGEN_EU]

export const ALLERGEN_EU_OPTIONS: { label: string; value: AllergenEU }[] = [
  { label: 'Gluten', value: ALLERGEN_EU.GLUTEN },
  { label: 'Crustaceans', value: ALLERGEN_EU.CRUSTACEANS },
  { label: 'Eggs', value: ALLERGEN_EU.EGGS },
  { label: 'Fish', value: ALLERGEN_EU.FISH },
  { label: 'Peanuts', value: ALLERGEN_EU.PEANUTS },
  { label: 'Soybeans', value: ALLERGEN_EU.SOYBEANS },
  { label: 'Milk', value: ALLERGEN_EU.MILK },
  { label: 'Nuts', value: ALLERGEN_EU.NUTS },
  { label: 'Celery', value: ALLERGEN_EU.CELERY },
  { label: 'Mustard', value: ALLERGEN_EU.MUSTARD },
  { label: 'Sesame', value: ALLERGEN_EU.SESAME },
  { label: 'Sulphites', value: ALLERGEN_EU.SULPHITES },
  { label: 'Lupin', value: ALLERGEN_EU.LUPIN },
  { label: 'Molluscs', value: ALLERGEN_EU.MOLLUSCS },
]

export const UNIT = {
  PIECE: 'piece',
  KG: 'kg',
} as const

export type Unit = (typeof UNIT)[keyof typeof UNIT]

export const UNIT_OPTIONS: { label: string; value: Unit }[] = [
  { label: 'Piece', value: UNIT.PIECE },
  { label: 'Kg', value: UNIT.KG },
]

export const SHIPPING_METHOD = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const

export type ShippingMethod = (typeof SHIPPING_METHOD)[keyof typeof SHIPPING_METHOD]

export const SHIPPING_METHOD_OPTIONS: { label: string; value: ShippingMethod }[] = [
  { label: 'Pickup in store', value: SHIPPING_METHOD.PICKUP },
  { label: 'Home delivery', value: SHIPPING_METHOD.DELIVERY },
]

export const EMAIL_TYPE = {
  ORDER_RECEIVED: 'order_received',
  PAYMENT_LINK: 'payment_link',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_CANCELLED: 'order_cancelled',
} as const

export type EmailType = (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE]

export const EMAIL_TYPE_OPTIONS: { label: string; value: EmailType }[] = [
  { label: 'Order received', value: EMAIL_TYPE.ORDER_RECEIVED },
  { label: 'Payment link', value: EMAIL_TYPE.PAYMENT_LINK },
  { label: 'Payment confirmed', value: EMAIL_TYPE.PAYMENT_CONFIRMED },
  { label: 'Order shipped', value: EMAIL_TYPE.ORDER_SHIPPED },
  { label: 'Order cancelled', value: EMAIL_TYPE.ORDER_CANCELLED },
]

export const EMAIL_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained',
  FAILED: 'failed',
} as const

export type EmailStatus = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS]

export const EMAIL_STATUS_OPTIONS: { label: string; value: EmailStatus }[] = [
  { label: 'Sent', value: EMAIL_STATUS.SENT },
  { label: 'Delivered', value: EMAIL_STATUS.DELIVERED },
  { label: 'Opened', value: EMAIL_STATUS.OPENED },
  { label: 'Clicked', value: EMAIL_STATUS.CLICKED },
  { label: 'Bounced', value: EMAIL_STATUS.BOUNCED },
  { label: 'Complained', value: EMAIL_STATUS.COMPLAINED },
  { label: 'Failed', value: EMAIL_STATUS.FAILED },
]
