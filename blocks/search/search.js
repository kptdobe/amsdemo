import { lookupArticles } from '../../scripts/scripts.js';
import { createCard } from '../featured-articles/featured-articles.js';

function highlightTextElements(terms, elements) {
  elements.forEach((e) => {
    const matches = [];
    const text = e.textContent;
    const offset = text.toLowerCase().indexOf(terms);
    if (offset >= 0) {
      matches.push({ offset, terms });
    }
    matches.sort((a, b) => a.offset - b.offset);
    let markedUp = '';
    if (!matches.length) {
      markedUp = text;
    } else {
      markedUp = text.substr(0, matches[0].offset);
      matches.forEach((hit, i) => {
        markedUp += `<mark class="search-highlight">${text.substr(hit.offset, hit.terms.length)}</mark>`;
        if (matches.length - 1 === i) {
          markedUp += text.substr(hit.offset + hit.terms.length);
        } else {
          markedUp += text.substring(hit.offset + hit.terms.length, matches[i + 1].offset);
        }
      });
      e.innerHTML = markedUp;
    }
  });
}

async function displaySearchResults(terms, results) {
  await lookupArticles([]);
  const allPages = window.pageIndex.data;
  results.textContent = '';
  const filtered = allPages.filter((e) => e.title.toLowerCase().includes(terms.toLowerCase())
    || e.description.toLowerCase().includes(terms.toLowerCase()));
  filtered.forEach((row) => {
    results.append(createCard(row, 'search'));
  });
  highlightTextElements(terms, results.querySelectorAll('h3, p:first-of-type'));
}

export default async function decorate(block) {
  block.innerHTML = `<div class="search-box"><input id="search-box" type="text" placeholder="${block.textContent}"></div>
    <div class="search-results"></div>`;
  const searchBox = document.getElementById('search-box');
  const results = block.querySelector('.search-results');
  searchBox.addEventListener('input', () => {
    displaySearchResults(searchBox.value, results);
  });
}
