import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Blocks, Download, HardDrive, KeyRound, Pickaxe, WalletCards } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { toPublicProjectPath } from '@/lib/project-path';

const tasks = [
  {
    title: 'Choose a wallet',
    description: 'Compare Desktop, Web, Android, Core CLI and experimental options.',
    href: '/docs/start-here/choose-a-wallet/',
    icon: WalletCards,
  },
  {
    title: 'Install safely',
    description: 'Find the right release for your platform and verify it before opening it.',
    href: '/docs/wallets/install/',
    icon: Download,
  },
  {
    title: 'Create or restore',
    description: 'Understand the recovery choices before creating or importing a wallet.',
    href: '/docs/wallets/create-or-restore/',
    icon: KeyRound,
  },
  {
    title: 'Protect a wallet',
    description: 'Prepare a recoverable backup before an update, reinstall or device move.',
    href: '/docs/backup-and-security/',
    icon: HardDrive,
  },
  {
    title: 'Run a node',
    description: 'Install Core, keep RPC private and monitor the daemon with Guardian.',
    href: '/docs/run-a-node/',
    icon: Blocks,
  },
  {
    title: 'Mine CCX',
    description: 'Learn the network path and the checks to make before connecting hardware.',
    href: '/docs/mining/',
    icon: Pickaxe,
  },
];

export default function HomePage() {
  return (
    <div className="conceal-home">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_30rem] lg:px-10">
        <div className="max-w-3xl">
          <BrandMark />
          <h1 className="mt-10 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-7xl">
            Use Conceal with confidence.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-fd-muted-foreground sm:text-xl">
            Set up a wallet, protect your CCX, operate network software and build with Conceal’s
            public interfaces.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/docs/start-here/"
              className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-5 py-3 font-medium text-fd-primary-foreground"
            >
              Start here <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link
              href="/docs/releases-and-verification/"
              className="inline-flex items-center rounded-md border border-fd-border px-5 py-3 font-medium"
            >
              Releases and verification
            </Link>
          </div>
        </div>

        <div className="conceal-hero-coin" aria-hidden="true">
          <Image
            src={toPublicProjectPath('/brand/conceal-coin.webp')}
            alt=""
            width={640}
            height={640}
            priority
          />
        </div>
      </section>

      <section className="border-y border-fd-border bg-fd-card/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">What do you need to do?</h2>
            <p className="mt-3 leading-7 text-fd-muted-foreground">
              Follow a task from beginning to end, with the safety checks in the right place.
            </p>
          </div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-xl bg-fd-border sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map(({ title, description, href, icon: Icon }) => (
              <Link key={href} href={href} className="conceal-task-card group flex flex-col justify-between p-6 text-left">
                <Icon aria-hidden="true" className="text-[var(--conceal-signal)]" size={23} />
                <span className="mt-8">
                  <span className="flex items-center justify-between gap-3 font-semibold">
                    {title}
                    <ArrowRight aria-hidden="true" className="opacity-50 group-hover:opacity-100" size={17} />
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-fd-muted-foreground">{description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 lg:px-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">Build with Conceal</h2>
          <p className="mt-3 max-w-xl leading-7 text-fd-muted-foreground">
            Start with Core RPC, then choose the JavaScript primitives or typed wallet SDK that matches your application.
          </p>
          <Link href="/docs/developer-and-api/" className="mt-5 inline-flex items-center gap-2 font-medium text-fd-primary">
            Open developer documentation <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">Check the network</h2>
          <p className="mt-3 max-w-xl leading-7 text-fd-muted-foreground">
            Separate fixed consensus rules from figures that change as the chain advances.
          </p>
          <Link href="/docs/network-and-ccx/" className="mt-5 inline-flex items-center gap-2 font-medium text-fd-primary">
            Read the network reference <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
