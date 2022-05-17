/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

// eslint-disable-next-line no-unused-vars
const cleanupName = (name) => {
  let n = name;
  const firstChar = n.charAt(0);
  const lastChar = n.charAt(n.length - 1);
  if (!/[A-Za-z0-9]/.test(firstChar)) {
    n = n.substring(1);
  }
  if (!/[A-Za-z0-9]/.test(lastChar)) {
    n = n.slice(0, -1);
  }
  return n;
};

const createMetadata = (main, document, html) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const category = document.querySelector('[property="article:section"]');
  if (category) {
    meta.Category = category.content;
  }

  const date = document.querySelector('[property="article:published_time"]');
  if (date) {
    meta['Publication Date'] = date.content.substring(0, date.content.indexOf('T'));
  }

  const updated = main.querySelector('.blogPostContent__metaModifiedDate');
  if (updated && updated.textContent) {
    const d = updated.textContent.replace('Updated ', '');
    meta['Updated Date'] = new Date(d).toISOString().substring(0, 10);
  }

  const author = main.querySelector('[rel="author"]');
  if (author) {
    meta.Author = author;
  }

  const metatop = main.querySelector('.blogPostContent__metaTop');
  if (metatop) {
    const split = metatop.textContent.trim().split('\n');
    if (split.length === 3) {
      // eslint-disable-next-line prefer-destructuring
      meta['Read Time'] = split[2].trim();
    }
  }

  const img = document.querySelector('[property="og:image"]');
  if (img) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const match = html.toString().match(/yoast-schema-graph yoast-schema-graph--main['"]>(.*)<\/script>/);
  if (match && match.length > 1) {
    try {
      const obj = JSON.parse(match[1]);
      const url = obj['@graph'] && obj['@graph'].length > 1 ? obj['@graph'][2].image?.url : null;
      if (url) {
        const el = document.createElement('img');
        el.src = url;
        meta['Card Image'] = el;
      }
    } catch (error) {
      console.warn(`Unable to parse yoast meta object: ${error.message}`);
    }
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

const createEmbeds = (main, document) => {
  main.querySelectorAll('iframe').forEach((embed) => {
    let src = embed.getAttribute('src');
    src = src && src.startsWith('//') ? `https:${src}` : src;
    if (src) {
      embed.replaceWith(WebImporter.DOMUtils.createTable([
        ['Embed'],
        [`<a href="${src}">${src}</a>`],
      ], document));
    }
  });
};

const createCallouts = (main, document) => {
  main.querySelectorAll('.blogPostContent__ctaContainer, .blogPostContent__quoteContainer').forEach((callout) => {
    const rows = [];
    let blockName = 'Callout';

    if (callout.classList.contains('blogPostContent__ctaContainer--right') || callout.classList.contains('blogPostContent__quoteContainer--right')) {
      blockName += ' (right)';
    } else if (callout.classList.contains('blogPostContent__ctaContainer--left') || callout.classList.contains('blogPostContent__quoteContainer--left')) {
      blockName += ' (left)';
    }

    rows.push([blockName]);

    const container = document.createElement('div');

    const firstText = callout.querySelector('.blogPostContent__ctaText');
    if (firstText) {
      const h = document.createElement('h3');
      h.innerHTML = firstText.textContent;
      container.append(h);
    }

    const sub = callout.querySelector('.blogPostContent__ctaSubheading') || callout.querySelector('.blogPostContent__quote');
    if (sub) {
      const p = document.createElement('p');
      p.innerHTML = sub.innerHTML;
      container.append(p);
    }

    rows.push([container]);

    const cta = callout.querySelector('a');
    if (cta) {
      rows.push([cta]);
    }
    callout.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
  });
};

const createImageBlocks = (main, document) => {
  main.querySelectorAll('img.alignleft, img.alignright').forEach((img) => {
    const rows = [];
    let blockName = 'Image';

    if (img.classList.contains('alignright')) {
      blockName += ' (right)';
    } else if (img.classList.contains('alignleft')) {
      blockName += ' (left)';
    }

    rows.push([blockName]);
    rows.push([img]);

    img.parentNode.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
  });

  main.querySelectorAll('.blogPostContent__imgContainer').forEach((div) => {
    const img = div.querySelector('img');
    if (img) {
      const rows = [];
      let blockName = 'Image';

      if (div.classList.contains('blogPostContent__imgContainer--right')) {
        blockName += ' (right)';
      } else if (div.classList.contains('blogPostContent__imgContainer--left')) {
        blockName += ' (left)';
      }

      rows.push([blockName]);
      rows.push([img]);

      div.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
    }
  });
};

const createTOC = (main, document) => {
  const toc = main.querySelector('.blogPostContentToc');
  if (toc) {
    const table = WebImporter.DOMUtils.createTable([['TOC']], document);
    toc.replaceWith(table);
  }
};

const createRelatedPostsBlock = (main, document) => {
  const related = document.querySelectorAll('.blogPostsBlock__titleLink');
  if (related) {
    const cells = [];
    cells.push(['Related Posts']);
    related.forEach((r) => {
      // eslint-disable-next-line no-param-reassign
      r.innerHTML = r.getAttribute('href');
      cells.push([r]);
    });
    const table = WebImporter.DOMUtils.createTable(cells, document);
    main.append(table);
  }
};

const cleanupHeadings = (main) => {
  main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    // eslint-disable-next-line no-param-reassign
    h.innerHTML = h.textContent;
  });
};

const makeAbsoluteLinks = (main) => {
  main.querySelectorAll('a').forEach((a) => {
    if (a.href.startsWith('/')) {
      const ori = a.href;
      const u = new URL(a.href, 'https://www.bamboohr.com/');
      a.href = u.toString();

      if (a.textContent === ori) {
        a.textContent = a.href;
      }
    }
  });
};

const makeProxySrcs = (main) => {
  main.querySelectorAll('img').forEach((img) => {
    if (img.src.startsWith('/')) {
      img.src = `http://localhost:3001${img.src}?host=https://www.bamboohr.com`;
    } else {
      try {
        const u = new URL(img.src);
        u.searchParams.append('host', 'https://www.bamboohr.com');
        img.src = `http://localhost:3001${u.pathname}${u.search}`;
      } catch (error) {
        console.warn(`Unable to make proxy src for ${img.src}: ${error.message}`);
      }
    }
  });
};

const createHeroImage = (main, document) => {
  const heroDiv = main.querySelector('.blogPostBanner__img');
  if (heroDiv) {
    const heroAsImage = WebImporter.DOMUtils.replaceBackgroundByImg(heroDiv, document);
    const title = main.querySelector('h1');
    if (title) title.before(heroAsImage);
  }
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @returns {HTMLElement} The root element
   */
  transformDOM: ({ document, html }) => {
    const main = document.querySelector('.blogPostMain');

    createTOC(main, document);
    createHeroImage(main, document);
    createCallouts(main, document);

    createRelatedPostsBlock(main, document);
    createEmbeds(main, document);
    createImageBlocks(main, document);
    createMetadata(main, document, html);
    cleanupHeadings(main, document);
    makeAbsoluteLinks(main);
    makeProxySrcs(main);

    WebImporter.DOMUtils.remove(document, [
      '.blogPostContent__meta',
      '.blogPostContent__metaTop',
      'header',
      'NavbarMobile',
      '.blogSearchIcon__container',
      'script',
      'noscript',
      '.Footer',
      '.blogSearch__overlay',
      '.blogPostBanner__extra',
      '.blogSocial',
      '.blogPostContentSubscribe',
      '.blogPostAuthor',
    ]);

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {String} url The url of the document being transformed.
   * @param {HTMLDocument} document The document
   */
  // eslint-disable-next-line arrow-body-style
  generateDocumentPath: ({ url }) => {
    return new URL(url).pathname.replace(/\/$/, '');
  },
};