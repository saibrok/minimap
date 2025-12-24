<template>
  <div
    ref="rootEl"
    class="text"
  >
    {{ text }}
  </div>
</template>

<script setup>
// Импортируем ref и onMounted для доступа к DOM и жизненного цикла.
import { onMounted, ref } from 'vue';

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
 * События, которые компонент отправляет наружу.
 */
const emit = defineEmits(['ready']);

/**
 * Ссылка на DOM-элемент скроллируемого блока.
 * @type {import('vue').Ref<HTMLElement | null>}
 */
const rootEl = ref(null);

/**
 * Сообщаем родителю DOM-элемент после монтирования.
 */
function notifyReady() {
  emit('ready', rootEl.value);
}

onMounted(() => {
  notifyReady();
});

/**
 * Даем родителю доступ к DOM-элементу.
 */
defineExpose({ rootEl });
</script>

<style scoped>
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
}

.text::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
