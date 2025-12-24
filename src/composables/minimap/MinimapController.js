import { handlePointerMove, handlePointerUp, handleViewportPointerDown } from './drag.js';
import { getOffsetY, scrollToMinimapY, syncViewport } from './metrics.js';
import { renderMinimap } from './render.js';

/**
 * Контроллер миникарты.
 * Хранит состояние и связывает scroll/drag/рендер.
 */
export class MinimapController {
  /**
   * @param {Object} params
   * @param {HTMLElement} params.scrollEl Скроллируемый элемент.
   * @param {HTMLElement} params.minimapEl Контейнер миникарты.
   * @param {HTMLElement} params.viewportEl Оверлей видимой области.
   * @param {HTMLCanvasElement} params.canvasEl Канвас для рендера.
   */
  constructor({ scrollEl, minimapEl, viewportEl, canvasEl }) {
    // Запоминаем ключевые DOM-узлы.
    this.scrollEl = scrollEl;
    this.minimapEl = minimapEl;
    this.viewportEl = viewportEl;
    this.canvasEl = canvasEl;

    // Логическое состояние перетаскивания.
    this.isDragging = false;
    // Смещение курсора внутри viewport при старте drag.
    this.dragOffsetY = 0;
    // Идентификатор активного указателя.
    this.activePointerId = null;
    // Токен для отсечения устаревших рендеров.
    this.renderToken = 0;
    // ResizeObserver для перерасчета.
    this.resizeObserver = null;
    // Координаты для расчета drag без скачков.
    this.dragStartPointerY = 0;
    this.dragStartViewportTop = 0;

    // Привязываем this к обработчикам.
    this.handleScroll = this.handleScroll.bind(this);
    this.handleMinimapPointerDown = this.handleMinimapPointerDown.bind(this);
    this.handleViewportPointerDown = this.handleViewportPointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Инициализирует обработчики и первичный рендер.
   */
  init() {
    // Слушаем скролл основного блока.
    this.scrollEl.addEventListener('scroll', this.handleScroll);
    // Обрабатываем клик по миникарте.
    this.minimapEl.addEventListener('pointerdown', this.handleMinimapPointerDown);
    // Обрабатываем drag по viewport.
    this.viewportEl.addEventListener('pointerdown', this.handleViewportPointerDown);
    // Глобальные события для перетаскивания.
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    // Следим за изменением размеров.
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.scrollEl);
    this.resizeObserver.observe(this.minimapEl);

    // Первый рендер и синхронизация.
    this.render();
    this.sync();
  }

  /**
   * Снимает обработчики и освобождает ресурсы.
   */
  destroy() {
    // Если было активное перетаскивание — освобождаем захват.
    if (this.isDragging && this.activePointerId !== null) {
      try {
        this.viewportEl.releasePointerCapture(this.activePointerId);
      } catch (error) {
        // Игнорируем ошибки, если захват уже снят браузером.
      }
    }
    // Сбрасываем состояние drag.
    this.isDragging = false;
    this.activePointerId = null;
    this.dragStartPointerY = 0;
    this.dragStartViewportTop = 0;
    this.viewportEl.classList.remove('dragging');

    // Снимаем обработчики скролла/кликов/drag.
    this.scrollEl.removeEventListener('scroll', this.handleScroll);
    this.minimapEl.removeEventListener('pointerdown', this.handleMinimapPointerDown);
    this.viewportEl.removeEventListener('pointerdown', this.handleViewportPointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);

    // Отключаем наблюдатель.
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Обновляет позицию viewport при скролле текста.
   */
  handleScroll() {
    // Во время drag не дергаем синхронизацию.
    if (this.isDragging) return;
    // Обновляем viewport.
    this.sync();
  }

  /**
   * Клик по миникарте прыгает к позиции.
   * @param {PointerEvent} event
   */
  handleMinimapPointerDown(event) {
    // Если кликаем по viewport — это другой сценарий.
    if (event.target === this.viewportEl) return;
    // Переходим к позиции клика.
    scrollToMinimapY(this, getOffsetY(this, event));
  }

  /**
   * Старт перетаскивания viewport.
   * @param {PointerEvent} event
   */
  handleViewportPointerDown(event) {
    handleViewportPointerDown(this, event);
  }

  /**
   * Движение указателя при перетаскивании.
   * @param {PointerEvent} event
   */
  handlePointerMove(event) {
    handlePointerMove(this, event);
  }

  /**
   * Завершение перетаскивания.
   * @param {PointerEvent} event
   */
  handlePointerUp(event) {
    handlePointerUp(this, event);
  }

  /**
   * Рендерит SVG-скриншот в canvas.
   */
  render() {
    renderMinimap(this);
  }

  /**
   * Синхронизирует позицию viewport с текущим scrollTop.
   */
  sync() {
    syncViewport(this);
  }

  /**
   * Реакция на ресайз: рендер + синхронизация.
   */
  handleResize() {
    // Перерисовываем canvas.
    this.render();
    // Синхронизируем viewport.
    this.sync();
  }
}
