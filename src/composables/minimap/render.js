import { cloneWithInlineStyles } from './inlineStyles.js';
import { buildSvgDataUrl } from './svg.js';

/**
 * Рендерит SVG-скриншот в canvas.
 * @param {Object} controller
 */
export function renderMinimap(controller) {
  // Берем контекст канваса.
  const ctx = controller.canvasEl.getContext('2d');
  // Если контекст не доступен — выходим.
  if (!ctx) return;

  // Считываем размеры миникарты.
  const w = controller.minimapEl.clientWidth;
  const h = controller.minimapEl.clientHeight;
  // Если размеры нулевые — нечего рисовать.
  if (w === 0 || h === 0) return;

  // Учитываем плотность пикселей.
  const dpr = window.devicePixelRatio || 1;
  controller.canvasEl.width = Math.max(1, Math.floor(w * dpr));
  controller.canvasEl.height = Math.max(1, Math.floor(h * dpr));
  // Масштабируем контекст до CSS-пикселей.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Размеры оригинального контента.
  const sourceWidth = Math.max(1, controller.scrollEl.clientWidth);
  const sourceHeight = Math.max(1, controller.scrollEl.scrollHeight);
  // Токен рендера, чтобы не рисовать устаревшие кадры.
  const token = (controller.renderToken += 1);

  // Клонируем блок и применяем стили.
  const clone = cloneWithInlineStyles(controller.scrollEl);
  clone.style.width = `${sourceWidth}px`;
  clone.style.height = `${sourceHeight}px`;
  clone.style.overflow = 'hidden';
  clone.style.boxSizing = 'border-box';

  // Строим SVG и получаем data URL.
  const dataUrl = buildSvgDataUrl(clone, sourceWidth, sourceHeight);

  // Грузим SVG в Image, чтобы нарисовать в canvas.
  const img = new Image();
  img.onload = () => {
    handleImageLoad(controller, ctx, w, h, sourceWidth, sourceHeight, token, img);
  };
  img.src = dataUrl;
}

/**
 * Отрисовываем картинку после загрузки.
 * @param {Object} controller
 * @param {CanvasRenderingContext2D} ctx Контекст канваса.
 * @param {number} w Ширина миникарты.
 * @param {number} h Высота миникарты.
 * @param {number} sourceWidth Ширина скролл-контента.
 * @param {number} sourceHeight Высота скролл-контента.
 * @param {number} token Номер актуального рендера.
 * @param {HTMLImageElement} img Загруженная картинка.
 */
export function handleImageLoad(controller, ctx, w, h, sourceWidth, sourceHeight, token, img) {
  // Игнорируем устаревшие рендеры.
  if (token !== controller.renderToken) return;
  // Очищаем канвас.
  ctx.clearRect(0, 0, w, h);
  // Рисуем изображение с масштабированием под миникарту.
  ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, w, h);
}
