// Подключаем фабрику приложения Vue.
import { createApp } from 'vue';
// Импортируем корневой компонент.
import App from './App.vue';
// Подключаем глобальные стили.
import './style.css';

// Создаем приложение и монтируем его в #app.
createApp(App).mount('#app');
