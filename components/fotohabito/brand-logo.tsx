import { cn } from '@/lib/utils'

type BrandLogoProps = {
  size?: 'sm' | 'md'
  /** horizontal (header) | stacked (auth) */
  layout?: 'horizontal' | 'stacked'
  /** @deprecated Wordmark layout is fixed */
  showWordmark?: boolean
  className?: string
}

/**
 * Isologo: cámara + wordmark FOTOHABIT (imagen) + eslogan tipográfico en código.
 */
export function BrandLogo({
  size = 'md',
  layout = 'horizontal',
  className,
}: BrandLogoProps) {
  const stacked = layout === 'stacked'
  const iconH = stacked
    ? size === 'sm'
      ? 'h-[4.5rem] w-auto'
      : 'h-24 w-auto sm:h-28'
    : size === 'sm'
      ? 'h-10'
      : 'h-12 sm:h-14'
  const wordH = stacked
    ? size === 'sm'
      ? 'h-8'
      : 'h-10 sm:h-11'
    : size === 'sm'
      ? 'h-6'
      : 'h-7 sm:h-8'

  return (
    <div
      className={cn(
        'overflow-visible bg-transparent',
        stacked
          ? 'mx-auto flex w-full max-w-xs flex-col items-center justify-center gap-3.5'
          : 'flex items-center gap-3',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/icono-camara.png?v=fh-parts-2"
        alt=""
        width={459}
        height={384}
        decoding="async"
        aria-hidden="true"
        className={cn(
          iconH,
          'shrink-0 border-0 bg-transparent object-contain p-0',
          'shadow-none outline-none ring-0 filter-none',
          '[image-rendering:-webkit-optimize-contrast]',
        )}
      />

      <div
        className={cn(
          'flex min-w-0 flex-col justify-center gap-0.5 bg-transparent leading-none',
          stacked ? 'items-center' : 'items-center',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/texto-fotohabit.png?v=fh-word-1"
          alt="FotoHabit"
          width={631}
          height={102}
          decoding="async"
          className={cn(
            wordH,
            'w-auto max-w-full border-0 bg-transparent object-contain object-center p-0',
            'shadow-none outline-none ring-0 filter-none',
            '[image-rendering:-webkit-optimize-contrast]',
          )}
        />
        <span
          className={cn(
            'text-center font-medium tracking-wide text-cyan-200/90',
            'drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]',
            '[text-shadow:0_0_6px_rgba(0,242,254,0.55),0_0_12px_rgba(188,19,254,0.35)]',
            size === 'sm' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm',
          )}
        >
          21 Días Crean el Hábito
        </span>
      </div>
    </div>
  )
}
