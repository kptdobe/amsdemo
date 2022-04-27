import {
  createOptimizedPicture,
  getMetadata,
  toClassName,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  const authorPath = `/blog/author/${toClassName(getMetadata('author'))}`;
  const resp = await fetch(`${authorPath}.plain.html`);
  const text = await resp.text();
  const dom = new DOMParser().parseFromString(text, 'text/html');
  const img = dom.querySelector('img');
  const fullname = dom.querySelector('h1');
  const title = dom.querySelector('p');
  title.remove();
  fullname.remove();
  img.closest('p').remove();

  const picture = createOptimizedPicture(img.src, false, [{ width: '200' }]);
  block.innerHTML = `<div class="author-image">${picture.outerHTML}</div>
  <div class="author-description">
    <p>${fullname.textContent}</p>
    ${title.outerHTML}
    ${dom.body.innerHTML}
  </div>`;
}
