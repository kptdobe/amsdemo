import { lookupArticles } from '../../scripts/scripts.js';
import { createCard } from '../featured-articles/featured-articles.js';

export default async function decorate(block) {
  const pathnames = [...block.querySelectorAll('a')].map((a) => {
    let { pathname } = new URL(a.href);
    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    return pathname;
  });
  block.textContent = '';
  const articles = await lookupArticles(pathnames);
  articles.forEach((article) => {
    block.append(createCard(article, 'related-posts'));
  });
}
