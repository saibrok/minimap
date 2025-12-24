/**
 * Инлайнит вычисленные стили элемента в целевой DOM-узел.
 * @param {HTMLElement} sourceNode Исходный элемент.
 * @param {HTMLElement} targetNode Клон, которому применяем стили.
 */
function inlineStyles(sourceNode, targetNode) {
  // Берем все вычисленные стили для исходного элемента.
  const computed = getComputedStyle(sourceNode);
  // Пробегаем по списку CSS-свойств.
  for (let i = 0; i < computed.length; i += 1) {
    // Имя текущего свойства.
    const prop = computed[i];
    // Копируем значение и приоритет в клон.
    targetNode.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
  }
}

/**
 * Обходит дерево DOM и инлайнит стили во все дочерние элементы.
 * @param {HTMLElement} sourceEl Исходный узел.
 * @param {HTMLElement} targetEl Клон, куда пишем стили.
 */
function walkAndInlineStyles(sourceEl, targetEl) {
  // Обрабатываем только элементы.
  if (sourceEl.nodeType !== Node.ELEMENT_NODE || targetEl.nodeType !== Node.ELEMENT_NODE) return;
  // Инлайним стили для текущей пары узлов.
  inlineStyles(sourceEl, targetEl);

  // Получаем списки дочерних элементов.
  const sourceChildren = sourceEl.children;
  const targetChildren = targetEl.children;
  // Рекурсивно обходим дерево.
  for (let i = 0; i < sourceChildren.length; i += 1) {
    walkAndInlineStyles(sourceChildren[i], targetChildren[i]);
  }
}

/**
 * Делает глубокий клон DOM-дерева и инлайнит стили для каждого элемента.
 * @param {HTMLElement} sourceNode Исходный элемент.
 * @returns {HTMLElement} Клон с инлайновыми стилями.
 */
export function cloneWithInlineStyles(sourceNode) {
  // Клонируем DOM-узел вместе с детьми.
  const clone = sourceNode.cloneNode(true);
  // Инлайним стили во всем дереве.
  walkAndInlineStyles(sourceNode, clone);
  // Возвращаем готовый клон.
  return clone;
}
