/**
 * Возвращает позицию указателя относительно миникарты.
 * @param {{minimapEl: HTMLElement}} controller
 * @param {PointerEvent|MouseEvent} event
 * @returns {number}
 */
export function getOffsetY(controller, event) {
  // Берем координаты миникарты.
  const rect = controller.minimapEl.getBoundingClientRect();
  // Возвращаем положение указателя относительно верхнего края.
  return event.clientY - rect.top;
}

/**
 * Считает метрики для синхронизации.
 * @param {{scrollEl: HTMLElement, minimapEl: HTMLElement}} controller
 * @returns {{mmHeight: number, maxScrollTop: number, scale: number, viewportHeight: number, maxViewportTop: number}}
 */
export function getMetrics(controller) {
  // Высота всего контента.
  const scrollHeight = controller.scrollEl.scrollHeight;
  // Высота видимой области.
  const clientHeight = controller.scrollEl.clientHeight;
  // Высота миникарты.
  const mmHeight = controller.minimapEl.clientHeight;

  // Максимальный scrollTop.
  const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
  // Коэффициент масштабирования по высоте.
  const scale = mmHeight / (scrollHeight || 1);
  // Высота viewport в миникарте.
  const viewportHeight = Math.max(24, clientHeight * scale);
  // Максимальный верхний отступ viewport.
  const maxViewportTop = Math.max(0, mmHeight - viewportHeight);

  // Возвращаем метрики.
  return { mmHeight, maxScrollTop, scale, viewportHeight, maxViewportTop };
}

/**
 * Синхронизирует позицию viewport с текущим scrollTop.
 * @param {{scrollEl: HTMLElement, viewportEl: HTMLElement}} controller
 */
export function syncViewport(controller) {
  // Получаем текущие метрики.
  const { maxScrollTop, scale, viewportHeight, maxViewportTop } = getMetrics(controller);
  // Обновляем высоту viewport.
  controller.viewportEl.style.height = `${viewportHeight}px`;

  // Если скролла нет — фиксируем положение.
  if (maxScrollTop === 0) {
    controller.viewportEl.style.top = '0px';
    return;
  }

  // Вычисляем положение viewport.
  const rawTop = controller.scrollEl.scrollTop * scale;
  const top = Math.min(maxViewportTop, Math.max(0, rawTop));
  // Применяем позицию.
  controller.viewportEl.style.top = `${top}px`;
}

/**
 * Преобразует координату миникарты в scrollTop.
 * @param {{scrollEl: HTMLElement, viewportEl: HTMLElement}} controller
 * @param {number} minimapY
 */
export function scrollToMinimapY(controller, minimapY) {
  // Берем метрики для преобразования.
  const { mmHeight, maxScrollTop, viewportHeight } = getMetrics(controller);
  // Центрируем viewport вокруг клика.
  const y = minimapY - viewportHeight / 2;
  // Ограничиваем координату.
  const clampedY = Math.min(mmHeight - viewportHeight, Math.max(0, y));
  // Переводим координату миникарты в долю скролла.
  const ratio = mmHeight - viewportHeight === 0 ? 0 : clampedY / (mmHeight - viewportHeight);
  // Устанавливаем scrollTop.
  controller.scrollEl.scrollTop = ratio * maxScrollTop;
  // Обновляем viewport.
  syncViewport(controller);
}
