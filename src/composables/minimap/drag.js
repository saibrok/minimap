import { scrollToMinimapY } from './metrics.js';

/**
 * Старт перетаскивания viewport.
 * @param {Object} controller
 * @param {PointerEvent} event
 */
export function handleViewportPointerDown(controller, event) {
  // Фиксируем состояние drag.
  controller.isDragging = true;
  // Запоминаем активный указатель.
  controller.activePointerId = event.pointerId;
  // Захватываем pointer, чтобы не терять события.
  controller.viewportEl.setPointerCapture(event.pointerId);
  // Меняем курсор.
  controller.viewportEl.classList.add('dragging');

  // Считаем смещение внутри viewport.
  const rect = controller.viewportEl.getBoundingClientRect();
  controller.dragOffsetY = event.clientY - rect.top;
  controller.dragStartPointerY = event.clientY;
  controller.dragStartViewportTop = rect.top;

  // Отключаем стандартные действия браузера.
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Движение указателя при перетаскивании.
 * @param {Object} controller
 * @param {PointerEvent} event
 */
export function handlePointerMove(controller, event) {
  // Ничего не делаем, если drag не активен.
  if (!controller.isDragging) return;
  // Игнорируем чужие указатели.
  if (controller.activePointerId !== null && event.pointerId !== controller.activePointerId) return;

  // Преобразуем координату указателя в координату миникарты без скачков.
  const rect = controller.minimapEl.getBoundingClientRect();
  const deltaY = event.clientY - controller.dragStartPointerY;
  const viewportTop = controller.dragStartViewportTop - rect.top + deltaY;
  const minimapY = viewportTop + controller.dragOffsetY;
  // Скроллим текст.
  scrollToMinimapY(controller, minimapY);
}

/**
 * Завершение перетаскивания.
 * @param {Object} controller
 * @param {PointerEvent} event
 */
export function handlePointerUp(controller, event) {
  // Если drag не активен — выходим.
  if (!controller.isDragging) return;
  // Проверяем, что это наш указатель.
  if (controller.activePointerId !== null && event.pointerId !== controller.activePointerId) return;

  // Сбрасываем состояние drag.
  controller.isDragging = false;
  controller.activePointerId = null;
  controller.dragStartPointerY = 0;
  controller.dragStartViewportTop = 0;
  // Возвращаем обычный курсор.
  controller.viewportEl.classList.remove('dragging');
}
