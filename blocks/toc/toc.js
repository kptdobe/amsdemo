export default function decorate(block) {
  const title = document.createElement('div');
  title.className = 'toc-title';
  title.textContent = 'Table of Content';
  block.textContent = '';
  block.append(title);

  const tocItems = document.querySelectorAll('h2');
  const ol = document.createElement('ol');
  tocItems.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${item.id}">${item.textContent}</a>`;
    ol.append(li);
  });
  block.append(ol);
}
