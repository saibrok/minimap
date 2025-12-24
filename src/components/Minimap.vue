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
   * DOM-элемент скроллируемого блока или ref на него.
   * @type {HTMLElement | import('vue').Ref<HTMLElement | null>}
   */
  scrollEl: {
    type: Object,
    required: true,
  },
  /**
   * Текст, чтобы перерендеривать скриншот при изменениях.
   * @type {string}
   */
  content: {
    type: String,
    required: true,
  },
  /**
   * Настройки, влияющие на внешний вид текста.
   * @type {{fontSize: number, paddingInline: number}}
   */
  settings: {
    type: Object,
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
  return props.scrollEl?.value ?? props.scrollEl ?? null;
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

watch(() => getScrollElement(), handleScrollTargetChange);

watch(() => props.content, handleContentChange, { flush: 'post' });
watch(() => props.settings, handleContentChange, { flush: 'post' });

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
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  height: 100%;
  width: 100%;
  touch-action: none;
}

.minimap-canvas {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
}

.minimap-viewport {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.08);
  cursor: grab;
  z-index: 2;
}

.minimap-viewport:hover {
  background: rgba(255, 255, 255, 0.12);
}

.minimap-viewport.dragging {
  cursor: grabbing;
  background: rgba(0, 150, 0, 0.12);
}
</style>
