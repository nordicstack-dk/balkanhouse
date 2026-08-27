import { useTranslations } from 'next-intl'

/* Notched tag flush with the card edge, rather than another rounded pill. */
export function PromoBadge({ percent }: { percent: number }) {
  const t = useTranslations('product')

  return (
    <span
      className="bh-nums inline-flex items-center bg-gold py-1 pl-2.5 pr-3.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-burgundy-deep shadow-soft"
      style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%)' }}
    >
      {t('promo', { percent })}
    </span>
  )
}
