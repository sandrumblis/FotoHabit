import Link from 'next/link'
import { BrandLogo } from './brand-logo'
import { LEGAL_DOCS, type LegalDocId } from '@/lib/legal-content'

export function LegalPage({ docId }: { docId: LegalDocId }) {
  const doc = LEGAL_DOCS[docId]
  const other = docId === 'privacy' ? LEGAL_DOCS.terms : LEGAL_DOCS.privacy

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-4">
          <Link href="/" className="w-fit">
            <BrandLogo size="sm" />
          </Link>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
              Legal · Actualizado {doc.updated}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {doc.title}
            </h1>
          </div>
        </header>

        <article className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-foreground">{section.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </article>

        <nav className="flex flex-wrap gap-4 pb-8 text-sm">
          <Link href="/" className="text-neon-cyan hover:underline">
            Volver a FotoHabit
          </Link>
          <Link href={other.path} className="text-muted-foreground hover:text-foreground hover:underline">
            {other.title}
          </Link>
        </nav>
      </div>
    </div>
  )
}
