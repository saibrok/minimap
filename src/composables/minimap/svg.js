/**
 * Собирает SVG с foreignObject и возвращает data URL.
 * @param {HTMLElement} node DOM-узел, который надо превратить в SVG.
 * @param {number} width Ширина для SVG.
 * @param {number} height Высота для SVG.
 * @returns {string} Data URL с SVG.
 */
export function buildSvgDataUrl(node, width, height) {
  // Создаем контейнер для XHTML.
  const wrapper = document.createElement('div');
  // Нужен xmlns, чтобы foreignObject корректно понял содержимое.
  wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Вкладываем клон внутрь контейнера.
  wrapper.appendChild(node);

  // Сериализуем DOM в строку.
  const serialized = new XMLSerializer().serializeToString(wrapper);
  // Собираем SVG-обертку с foreignObject.
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="',
    width,
    '" height="',
    height,
    '"><foreignObject width="100%" height="100%">',
    serialized,
    '</foreignObject></svg>',
  ].join('');

  // Возвращаем data URL для загрузки в Image.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
