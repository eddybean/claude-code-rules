import matter from 'gray-matter';

export function parseFrontmatter(content: string): {
  paths?: string;
  data: Record<string, unknown>;
  body: string;
} {
  // gray-matter (js-yaml) は glob の * をエイリアスとして解釈しエラーを投げることがある。
  // その場合は正規表現でフロントマターを直接パースしてフォールバックする。
  try {
    const parsed = matter(content);
    return {
      paths: parsed.data.paths as string | undefined,
      data: parsed.data,
      body: parsed.content.trim(),
    };
  } catch {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!fmMatch) return { data: {}, body: content.trim() };

    const fmBlock = fmMatch[1];
    const body = fmMatch[2].trim();

    // paths: の値を行単位で抽出（クォートあり・なし両対応）
    // クォートありは後方参照でペアを強制（末尾クォートが残るバグを防ぐ）
    const pathsMatch =
      fmBlock.match(/^paths:\s*(['"])(.*?)\1\s*$/m) ?? fmBlock.match(/^paths:\s*([^'"\s].*?)\s*$/m);
    const paths = pathsMatch ? (pathsMatch[2] ?? pathsMatch[1])?.trim() || undefined : undefined;

    return { paths, data: paths ? { paths } : {}, body };
  }
}

export function buildContent(body: string, paths?: string): string {
  if (!paths) return body;
  // glob パターンの * は YAML のエイリアス記号と衝突するため常にクォートする
  const needsQuote = /[*#:{}[\],&!|>'"%@`]/.test(paths);
  const quotedPaths = needsQuote ? `"${paths.replace(/"/g, '\\"')}"` : paths;
  return `---\npaths: ${quotedPaths}\n---\n${body}`;
}
