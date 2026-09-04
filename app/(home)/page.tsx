import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
        Source-backed documentation
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Conceal Wiki</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
        A searchable, reviewable home for Conceal Network documentation, built from current
        first-party sources and published as a static site.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/docs/" className="rounded-full bg-fd-primary px-5 py-3 font-medium text-fd-primary-foreground">
          Open documentation
        </Link>
        <a href="https://conceal.network/wiki/" className="rounded-full border border-fd-border px-5 py-3 font-medium">
          Visit the legacy production wiki
        </a>
      </div>
    </section>
  );
}
