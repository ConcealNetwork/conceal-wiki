import { source } from '@/lib/source';
import { toPublicProjectMarkdown } from '@/lib/project-path';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

export function GET() {
  return new Response(toPublicProjectMarkdown(llms(source).index()));
}
