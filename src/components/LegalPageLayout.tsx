import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, CalendarDays, Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from './seo/Seo';

export interface LegalSection { id: string; title: string; content: ReactNode }
interface Props {
  title: string;
  description: string;
  eyebrow: string;
  lastUpdated: string;
  icon: LucideIcon;
  sections: LegalSection[];
  contactEmail?: string;
}

export default function LegalPageLayout({ title, description, eyebrow, lastUpdated, icon: Icon, sections, contactEmail = 'legal@shayariurdu.com' }: Props) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950">
      <Seo title={title} description={description} keywords={`${title}, ShayariUrdu.com, legal, Urdu poetry`} />
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-amber-500 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-slate-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-amber-400"><ArrowLeft size={16} /> Back to home</Link>
          <div className="flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950"><Icon size={28} /></div>
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">{eyebrow}</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300"><CalendarDays size={16} className="text-amber-400" /> Last updated: {lastUpdated}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900" aria-label={`${title} sections`}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-400">On this page</p>
            <ul className="space-y-1">{sections.map((section, index) => (
              <li key={section.id}><a href={`#${section.id}`} className="flex gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-amber-400"><span className="font-semibold text-amber-600">{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>
            ))}</ul>
          </nav>
        </aside>
        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="divide-y divide-stone-200 dark:divide-neutral-800">{sections.map((section, index) => (
            <section id={section.id} key={section.id} className="scroll-mt-24 p-6 sm:p-9">
              <div className="mb-4 flex items-start gap-3"><span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">{index + 1}</span><h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{section.title}</h2></div>
              <div className="legal-copy text-[15px] leading-7 text-slate-600 dark:text-neutral-300 sm:pl-10 sm:text-base">{section.content}</div>
            </section>
          ))}</div>
          <div className="m-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/10 sm:m-9">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950"><Mail size={20} /></div>
            <div><h2 className="font-bold text-slate-900 dark:text-white">Questions about this policy?</h2><p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Contact us at <a className="font-semibold text-amber-700 underline underline-offset-4 dark:text-amber-400" href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p></div>
          </div>
        </article>
      </div>
    </div>
  );
}
