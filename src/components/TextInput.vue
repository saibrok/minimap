<template>
  <div class="controls">
    <textarea
      :value="modelValue"
      placeholder="Вставь текст сюда"
      @input="onInput"
    ></textarea>
    <button @click="onApply">Добавить</button>
  </div>
</template>

<script setup>
/**
 * Входные параметры компонента.
 */
const props = defineProps({
  /**
   * Текущее значение textarea.
   * @type {string}
   */
  modelValue: {
    type: String,
    required: true,
  },
});

/**
 * События, которые компонент отправляет наружу.
 */
const emit = defineEmits(['update:modelValue', 'apply']);

/**
 * Обрабатываем ввод в textarea.
 * @param {Event} event
 */
function onInput(event) {
  // Берем ссылку на textarea.
  const target = event.target;
  // Обновляем v-model в родителе.
  emit('update:modelValue', target.value);
}

/**
 * Обрабатываем клик по кнопке "Добавить".
 */
function onApply() {
  // Сообщаем родителю, что нужно применить текст.
  emit('apply');
}
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.controls textarea {
  flex: 1;
  width: 100%;
  padding: 12px;
  font-size: 16px;
  box-sizing: border-box;
  resize: vertical;
  background: #141821;
  color: #e6e6e6;
  border: 1px solid #2a3140;
  border-radius: 6px;
}

.controls button {
  width: fit-content;
  padding: 10px 14px;
  font-size: 16px;
  cursor: pointer;
  background: #1e2532;
  color: #e6e6e6;
  border: 1px solid #2a3140;
  border-radius: 6px;
}
</style>
