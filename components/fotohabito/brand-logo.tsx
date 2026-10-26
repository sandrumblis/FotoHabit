import Image from 'next/image'

export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* The source JPG has a baked-in checkerboard, so only the circular lens emblem is cropped out. */}
      <div className="relative size-11 shrink-0 overflow-hidden rounded-full shadow-[0_0_24px_-4px_rgba(34,211,238,0.55)] sm:size-12">
        <Image
          src="/images/fotohabito-logo.jpg"
          alt=""
          width={1024}
          height={1024}
          priority
          className="absolute max-w-none"
          style={{ width: '200.8%', height: 'auto', left: '-50.4%', top: '-38.6%' }}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          FotoHábito
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Hábitos con prueba
        </span>
      </div>
    </div>
  )
}
