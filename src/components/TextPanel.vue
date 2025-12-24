<template>
  <div class="panel">
    <div
      ref="rootEl"
      class="text"
    >
      {{ text }}
    </div>

    <div class="minimap-wrapper">
      <Minimap
        :scroll-el="rootEl"
        :content="text"
      />
    </div>
  </div>
</template>

<script setup>
// Импортируем ref для доступа к DOM.
import { ref } from 'vue';
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
});

/**
 * Ссылка на DOM-элемент скроллируемого блока.
 * @type {import('vue').Ref<HTMLElement | null>}
 */
const rootEl = ref(null);

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
  border: 1px solid #ddd;
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
}
</style>
