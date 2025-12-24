<template>
  <div class="app">
    <TextInput
      v-model="sourceText"
      @apply="applyText"
    />

    <div class="wrap">
      <TextPanel
        ref="textPanelRef"
        :text="displayText"
        @ready="setScrollElement"
      />

      <Minimap
        :scroll-el="scrollElement"
        :content="displayText"
      />
    </div>
  </div>
</template>

<script setup>
// Импортируем реактивность Vue.
import { ref } from 'vue';
// Импортируем компоненты интерфейса.
import TextInput from './components/TextInput.vue';
import TextPanel from './components/TextPanel.vue';
import Minimap from './components/Minimap.vue';

/**
 * Текст в textarea (черновик, который можно править).
 * @type {import('vue').Ref<string>}
 */
const sourceText = ref('');

/**
 * Текст, который реально показываем в блоке.
 * @type {import('vue').Ref<string>}
 */
const displayText = ref('');

/**
 * Ссылка на компонент TextPanel, чтобы получить DOM-элемент скролла.
 * @type {import('vue').Ref<InstanceType<typeof TextPanel> | null>}
 */
const textPanelRef = ref(null);

/**
 * DOM-элемент скроллируемого блока.
 * @type {import('vue').Ref<HTMLElement | null>}
 */
const scrollElement = ref(null);

/**
 * Копируем текст из textarea в отображаемый блок.
 */
function applyText() {
  // Кладем текст в блок для отображения.
  displayText.value = sourceText.value;
}

/**
 * Получаем DOM-элемент от компонента TextPanel.
 * @param {HTMLElement} element
 */
function setScrollElement(element) {
  scrollElement.value = element;
}
</script>

<style scoped>
.app {
  display: grid;
  gap: 12px;
  padding: 16px;
  max-height: 100vh;
  grid-template-rows: 300px 1fr;
}

.wrap {
  display: grid;
  grid-template-columns: 1fr 64px;
  gap: 12px;
}
</style>
