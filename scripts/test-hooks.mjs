import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

function withExtension(specifierUrl) {
  const pathname = fileURLToPath(specifierUrl);
  const candidates = [pathname, `${pathname}.ts`, `${pathname}.tsx`, `${pathname}.mjs`, `${pathname}.js`, `${pathname}/index.ts`];
  const found = candidates.find((candidate) => existsSync(candidate));
  return found ? pathToFileURL(found).href : specifierUrl.href;
}

// Lets Node run the TypeScript modules that Next resolves with the @/ alias.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const url = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
    return nextResolve(withExtension(url), context);
  }
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      const base = context.parentURL ? new URL(specifier, context.parentURL) : null;
      if (base) return nextResolve(withExtension(base), context);
      throw error;
    }
  }
  return nextResolve(specifier, context);
}
