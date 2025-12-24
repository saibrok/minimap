<template>
  <div
    ref="minimapEl"
    class="minimap"
    aria-label="Minimap"
  >
    <canvas
      ref="canvasEl"
      class="minimap-canvas"
    ></canvas>
    <div
      ref="viewportEl"
      class="minimap-viewport"
      title="Перетащи или кликни для прокрутки"
    ></div>
  </div>
</template>

<script setup>
// Vue-хуки для жизненного цикла и реактивности.
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
// Контроллер миникарты с логикой рендера и скролла.
import { MinimapController } from '../composables/useMinimap.js';

/**
 * Входные параметры миникарты.
 */
const props = defineProps({
  /**
   * DOM-элемент скроллируемого блока.
   * @type {HTMLElement | null}
   */
  scrollEl: {
    type: Object,
    required: false,
    default: null,
  },
  /**
   * Текст, чтобы перерендеривать скриншот при изменениях.
   * @type {string}
   */
  content: {
    type: String,
    required: true,
  },
});

/**
 * DOM-элементы миникарты.
 */
const minimapEl = ref(null);
const viewportEl = ref(null);
const canvasEl = ref(null);

/**
 * Экземпляр контроллера.
 * @type {MinimapController | null}
 */
let controller = null;

/**
 * Возвращает DOM-элемент скролла из компонента TextPanel.
 * @returns {HTMLElement | null}
 */
function getScrollElement() {
  // Берем DOM-элемент напрямую из пропса.
  return props.scrollEl || null;
}

/**
 * Создаем контроллер, когда появился DOM скролл-элемента.
 */
function initController() {
  // Берем DOM-элемент скролла.
  const scrollEl = getScrollElement();
  // Если его нет — выходим.
  if (!scrollEl) return;
  // Если нет DOM миникарты — выходим.
  if (!minimapEl.value || !viewportEl.value || !canvasEl.value) return;

  // Создаем контроллер и передаем все элементы.
  controller = new MinimapController({
    scrollEl,
    minimapEl: minimapEl.value,
    viewportEl: viewportEl.value,
    canvasEl: canvasEl.value,
  });

  // Инициализируем обработчики.
  controller.init();
}

/**
 * Удаляем обработчики при размонтировании.
 */
function destroyController() {
  // Если контроллера нет — ничего не делаем.
  if (!controller) return;
  // Отключаем обработчики.
  controller.destroy();
  // Сбрасываем ссылку.
  controller = null;
}

onMounted(() => {
  // При монтировании пробуем инициализировать.
  initController();
});

onUnmounted(() => {
  // При размонтировании чистим обработчики.
  destroyController();
});

watch(
  () => getScrollElement(),
  handleScrollTargetChange
);

watch(
  () => props.content,
  handleContentChange,
  { flush: 'post' }
);

/**
 * Пересоздаем контроллер, если изменился DOM-элемент скролла.
 */
function handleScrollTargetChange() {
  // Полностью пересоздаем контроллер, если поменялся DOM.
  destroyController();
  initController();
}

/**
 * Перерисовываем миникарту при изменении текста.
 */
async function handleContentChange() {
  // Без контроллера нечего обновлять.
  if (!controller) return;
  // Ждем, когда DOM обновится новым текстом.
  await nextTick();
  // Ререндерим скриншот.
  controller.render();
  // Синхронизируем viewport.
  controller.sync();
}
</script>

<style scoped>
.minimap {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  background: #f7f7f7;
  height: 100%;
  touch-action: none;
}

.minimap-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.minimap-viewport {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 20px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.1);
  outline: 1px solid rgba(0, 0, 0, 0.18);
  cursor: grab;
  z-index: 2;
}

.minimap-viewport.dragging {
  cursor: grabbing;
}

.minimap:hover .minimap-viewport {
  background: rgba(0, 0, 0, 0.14);
}
</style>
