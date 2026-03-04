import matter from 'gray-matter';

export function parseFrontmatter(content: string): {
  paths?: string;
  data: Record<string, unknown>;
  body: string;
} {
  const parsed = matter(content);
  return {
    paths: parsed.data.paths as string | undefined,
    data: parsed.data,
    body: parsed.content.trim(),
  };
}

export function buildContent(body: string, paths?: string): string {
  if (!paths) return body;
  return matter.stringify(body, { paths });
}
