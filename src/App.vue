<template>
  <div class="app">
    <TextInput
      v-model="sourceText"
      @apply="applyText"
    />

    <div class="settings">
      <label class="settings-row">
        <span>Размер шрифта: {{ fontSize }}px</span>
        <input
          v-model.number="fontSize"
          type="range"
          min="10"
          max="140"
          step="1"
        />
      </label>
      <label class="settings-row">
        <span>Padding inline: {{ paddingInline }}px</span>
        <input
          v-model.number="paddingInline"
          type="range"
          min="0"
          max="500"
          step="2"
        />
      </label>
    </div>

    <div class="wrap">
      <TextPanel
        ref="textPanelRef"
        :text="displayText"
        :font-size="fontSize"
        :padding-inline="paddingInline"
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
 * Настройки визуального текста.
 * @type {import('vue').Ref<number>}
 */
const fontSize = ref(18);
/**
 * Горизонтальные отступы текста.
 * @type {import('vue').Ref<number>}
 */
const paddingInline = ref(16);

/**
 * Копируем текст из textarea в отображаемый блок.
 */
function applyText() {
  // Кладем текст в блок для отображения.
  displayText.value = sourceText.value;
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

.settings {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid #2a3140;
  border-radius: 6px;
  background: #10141b;
}

.settings-row {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.settings-row input[type='range'] {
  width: 100%;
}

.wrap {
  display: grid;
  max-height: 50vh;
}
</style>
