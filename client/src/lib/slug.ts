/**
 * Converts a display name into a URL-safe, pluralized API ID slug.
 *
 * Examples:
 *   "Article"        → "articles"
 *   "Blog Post"      → "blog-posts"
 *   "Product Category" → "product-categories"
 *   "FAQ"            → "faqs"
 */
export function generateSlug(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  // Lowercase and replace non-alphanumeric runs with a hyphen
  const base = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Naive but correct pluralization for common English patterns
  return pluralize(base);
}

function pluralize(word: string): string {
  if (!word) return word;

  // Split on hyphens, pluralize only the last word
  const parts = word.split('-');
  const last = parts[parts.length - 1] ?? '';
  parts[parts.length - 1] = pluralizeSingleWord(last);
  return parts.join('-');
}

function pluralizeSingleWord(word: string): string {
  if (!word) return word;

  // Already plural heuristic
  if (word.endsWith('s') && !word.endsWith('ss')) return word;

  // Irregular forms
  const irregulars: Record<string, string> = {
    person: 'people',
    man: 'men',
    woman: 'women',
    child: 'children',
    tooth: 'teeth',
    foot: 'feet',
    mouse: 'mice',
    goose: 'geese',
  };
  if (irregulars[word]) return irregulars[word]!;

  // Rules (most specific first)
  if (/(?:s|ss|sh|ch|x|z)$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(?:[^f])fe?$/.test(word)) return `${word.replace(/fe?$/, 'ves')}`;
  if (/(?:us)$/.test(word)) return `${word.slice(0, -2)}i`;
  if (/(?:is)$/.test(word)) return `${word.slice(0, -2)}es`;
  if (/(?:on)$/.test(word)) return `${word.slice(0, -2)}a`;

  return `${word}s`;
}
