<template>
  <div class="panel">
    <div
      ref="rootEl"
      class="text"
      :style="textStyles"
    >
      {{ text }}
    </div>

    <div class="minimap-wrapper">
      <Minimap
        :scroll-el="rootEl"
        :content="text"
        :settings="minimapSettings"
      />
    </div>
  </div>
</template>

<script setup>
// Импортируем ref для доступа к DOM.
import { computed, ref } from 'vue';
import Minimap from './Minimap.vue';

/**
 * Текст для отображения.
 */
const props = defineProps({
  /**
   * Содержимое скроллируемого блока.
   * @type {string}
   */
  text: {
    type: String,
    required: true,
  },
  /**
   * Размер шрифта текста.
   * @type {number}
   */
  fontSize: {
    type: Number,
    required: true,
  },
  /**
   * Горизонтальные отступы.
   * @type {number}
   */
  paddingInline: {
    type: Number,
    required: true,
  },
});

/**
 * Ссылка на DOM-элемент скроллируемого блока.
 * @type {import('vue').Ref<HTMLElement | null>}
 */
const rootEl = ref(null);

/**
 * Инлайн-стили для текста.
 * @type {import('vue').ComputedRef<Record<string, string>>}
 */
const textStyles = computed(() => ({
  fontSize: `${props.fontSize}px`,
  paddingInline: `${props.paddingInline}px`,
}));

/**
 * Настройки для перерендера миникарты.
 * @type {import('vue').ComputedRef<{fontSize: number, paddingInline: number}>}
 */
const minimapSettings = computed(() => ({
  fontSize: props.fontSize,
  paddingInline: props.paddingInline,
}));

/**
 * Даем родителю доступ к DOM-элементу.
 */
defineExpose({ rootEl });
</script>

<style scoped>
.panel {
  position: relative;
  max-height: 50vh;
}

.text {
  border: 1px solid #2a3140;
  border-radius: 4px;
  padding: 16px;
  overflow: auto;
  line-height: 1.5;
  font-size: 18px;
  white-space: pre-wrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  height: 100%;
  box-sizing: border-box;
  background: #10141b;
  color: #e6e6e6;
}

.text::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.minimap-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 120px;
  border-left: 1px solid #2a3140;
  background: #0f131a;
}
</style>
