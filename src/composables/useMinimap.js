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
 * Делает глубокий клон DOM-дерева и инлайнит стили для каждого элемента.
 * @param {HTMLElement} sourceNode Исходный элемент.
 * @returns {HTMLElement} Клон с инлайновыми стилями.
 */
function cloneWithInlineStyles(sourceNode) {
  // Клонируем DOM-узел вместе с детьми.
  const clone = sourceNode.cloneNode(true);
  // Инлайним стили во всем дереве.
  walkAndInlineStyles(sourceNode, clone);
  // Возвращаем готовый клон.
  return clone;
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
 * Собирает SVG с foreignObject и возвращает data URL.
 * @param {HTMLElement} node DOM-узел, который надо превратить в SVG.
 * @param {number} width Ширина для SVG.
 * @param {number} height Высота для SVG.
 * @returns {string} Data URL с SVG.
 */
function buildSvgDataUrl(node, width, height) {
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
    this.handleImageLoad = this.handleImageLoad.bind(this);
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
    this.scrollToMinimapY(this.getOffsetY(event));
  }

  /**
   * Старт перетаскивания viewport.
   * @param {PointerEvent} event
   */
  handleViewportPointerDown(event) {
    // Фиксируем состояние drag.
    this.isDragging = true;
    // Запоминаем активный указатель.
    this.activePointerId = event.pointerId;
    // Захватываем pointer, чтобы не терять события.
    this.viewportEl.setPointerCapture(event.pointerId);
    // Меняем курсор.
    this.viewportEl.classList.add('dragging');

    // Считаем смещение внутри viewport.
    const rect = this.viewportEl.getBoundingClientRect();
    this.dragOffsetY = event.clientY - rect.top;
    this.dragStartPointerY = event.clientY;
    this.dragStartViewportTop = rect.top;

    // Отключаем стандартные действия браузера.
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Движение указателя при перетаскивании.
   * @param {PointerEvent} event
   */
  handlePointerMove(event) {
    // Ничего не делаем, если drag не активен.
    if (!this.isDragging) return;
    // Игнорируем чужие указатели.
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;

    // Преобразуем координату указателя в координату миникарты без скачков.
    const rect = this.minimapEl.getBoundingClientRect();
    const deltaY = event.clientY - this.dragStartPointerY;
    const viewportTop = this.dragStartViewportTop - rect.top + deltaY;
    const minimapY = viewportTop + this.dragOffsetY;
    // Скроллим текст.
    this.scrollToMinimapY(minimapY);
  }

  /**
   * Завершение перетаскивания.
   * @param {PointerEvent} event
   */
  handlePointerUp(event) {
    // Если drag не активен — выходим.
    if (!this.isDragging) return;
    // Проверяем, что это наш указатель.
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;

    // Сбрасываем состояние drag.
    this.isDragging = false;
    this.activePointerId = null;
    this.dragStartPointerY = 0;
    this.dragStartViewportTop = 0;
    // Возвращаем обычный курсор.
    this.viewportEl.classList.remove('dragging');
  }

  /**
   * Рендерит SVG-скриншот в canvas.
   */
  render() {
    // Берем контекст канваса.
    const ctx = this.canvasEl.getContext('2d');
    // Если контекст не доступен — выходим.
    if (!ctx) return;

    // Считываем размеры миникарты.
    const w = this.minimapEl.clientWidth;
    const h = this.minimapEl.clientHeight;
    // Если размеры нулевые — нечего рисовать.
    if (w === 0 || h === 0) return;

    // Учитываем плотность пикселей.
    const dpr = window.devicePixelRatio || 1;
    this.canvasEl.width = Math.max(1, Math.floor(w * dpr));
    this.canvasEl.height = Math.max(1, Math.floor(h * dpr));
    // Масштабируем контекст до CSS-пикселей.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Размеры оригинального контента.
    const sourceWidth = Math.max(1, this.scrollEl.clientWidth);
    const sourceHeight = Math.max(1, this.scrollEl.scrollHeight);
    // Токен рендера, чтобы не рисовать устаревшие кадры.
    const token = (this.renderToken += 1);

    // Клонируем блок и применяем стили.
    const clone = cloneWithInlineStyles(this.scrollEl);
    clone.style.width = `${sourceWidth}px`;
    clone.style.height = `${sourceHeight}px`;
    clone.style.overflow = 'hidden';
    clone.style.boxSizing = 'border-box';

    // Строим SVG и получаем data URL.
    const dataUrl = buildSvgDataUrl(clone, sourceWidth, sourceHeight);

    // Грузим SVG в Image, чтобы нарисовать в canvas.
    const img = new Image();
    img.onload = () => {
      this.handleImageLoad(ctx, w, h, sourceWidth, sourceHeight, token, img);
    };
    img.src = dataUrl;
  }

  /**
   * Синхронизирует позицию viewport с текущим scrollTop.
   */
  sync() {
    // Получаем текущие метрики.
    const { maxScrollTop, scale, viewportHeight, maxViewportTop } = this.getMetrics();
    // Обновляем высоту viewport.
    this.viewportEl.style.height = `${viewportHeight}px`;

    // Если скролла нет — фиксируем положение.
    if (maxScrollTop === 0) {
      this.viewportEl.style.top = '0px';
      return;
    }

    // Вычисляем положение viewport.
    const rawTop = this.scrollEl.scrollTop * scale;
    const top = Math.min(maxViewportTop, Math.max(0, rawTop));
    // Применяем позицию.
    this.viewportEl.style.top = `${top}px`;
  }

  /**
   * Преобразует координату миникарты в scrollTop.
   * @param {number} minimapY
   */
  scrollToMinimapY(minimapY) {
    // Берем метрики для преобразования.
    const { mmHeight, maxScrollTop, viewportHeight } = this.getMetrics();
    // Центрируем viewport вокруг клика.
    const y = minimapY - viewportHeight / 2;
    // Ограничиваем координату.
    const clampedY = Math.min(mmHeight - viewportHeight, Math.max(0, y));
    // Переводим координату миникарты в долю скролла.
    const ratio = mmHeight - viewportHeight === 0 ? 0 : clampedY / (mmHeight - viewportHeight);
    // Устанавливаем scrollTop.
    this.scrollEl.scrollTop = ratio * maxScrollTop;
    // Обновляем viewport.
    this.sync();
  }

  /**
   * Возвращает позицию указателя относительно миникарты.
   * @param {PointerEvent|MouseEvent} event
   * @returns {number}
   */
  getOffsetY(event) {
    // Берем координаты миникарты.
    const rect = this.minimapEl.getBoundingClientRect();
    // Возвращаем положение указателя относительно верхнего края.
    return event.clientY - rect.top;
  }

  /**
   * Считает метрики для синхронизации.
   * @returns {{mmHeight: number, maxScrollTop: number, scale: number, viewportHeight: number, maxViewportTop: number}}
   */
  getMetrics() {
    // Высота всего контента.
    const scrollHeight = this.scrollEl.scrollHeight;
    // Высота видимой области.
    const clientHeight = this.scrollEl.clientHeight;
    // Высота миникарты.
    const mmHeight = this.minimapEl.clientHeight;

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
   * Реакция на ресайз: рендер + синхронизация.
   */
  handleResize() {
    // Перерисовываем canvas.
    this.render();
    // Синхронизируем viewport.
    this.sync();
  }

  /**
   * Отрисовываем картинку после загрузки.
   * @param {CanvasRenderingContext2D} ctx Контекст канваса.
   * @param {number} w Ширина миникарты.
   * @param {number} h Высота миникарты.
   * @param {number} sourceWidth Ширина скролл-контента.
   * @param {number} sourceHeight Высота скролл-контента.
   * @param {number} token Номер актуального рендера.
   * @param {HTMLImageElement} img Загруженная картинка.
   */
  handleImageLoad(ctx, w, h, sourceWidth, sourceHeight, token, img) {
    // Игнорируем устаревшие рендеры.
    if (token !== this.renderToken) return;
    // Очищаем канвас.
    ctx.clearRect(0, 0, w, h);
    // Рисуем изображение с масштабированием под миникарту.
    ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, w, h);
  }
}
