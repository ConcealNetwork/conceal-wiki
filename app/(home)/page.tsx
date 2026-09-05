import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
        Official documentation
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Conceal documentation</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
        Learn how to choose a wallet, protect your CCX, run a node, mine, and build with
        Conceal Network.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/docs/" className="rounded-full bg-fd-primary px-5 py-3 font-medium text-fd-primary-foreground">
          Open documentation
        </Link>
        <a href="https://github.com/ConcealNetwork" className="rounded-full border border-fd-border px-5 py-3 font-medium">
          View Conceal on GitHub
        </a>
      </div>
    </section>
  );
}
