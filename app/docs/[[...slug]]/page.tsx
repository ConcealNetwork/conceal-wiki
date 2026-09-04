import { getPageImageUrl, getPageMarkdownUrl, source } from '@/lib/source';
import { CopyMarkdownButton } from '@/components/copy-markdown-button';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <section className="grid [grid-area:main] justify-items-center">
      <article id="nd-page" className="flex min-w-0 w-full max-w-[900px] flex-col gap-4 px-4 py-6 md:px-6 md:pt-8 xl:px-8 xl:pt-14">
        <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
        <p className="mb-0 text-lg text-fd-muted-foreground">{page.data.description}</p>
        <div className="flex flex-row items-center gap-2 border-b pb-6">
          <CopyMarkdownButton markdownUrl={markdownUrl} />
          <a
            className="inline-flex h-8 items-center rounded-md border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
            rel="noreferrer noopener"
            target="_blank"
          >
            Edit on GitHub
          </a>
        </div>
        <div className="prose flex-1">
          <MDX
            components={getMDXComponents({
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(source, page),
            })}
          />
        </div>
      </article>
    </section>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
