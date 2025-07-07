# RkM Project

## 🚀 Описание
Веб-приложение с тремя модулями:
- Стоимость инвентаря (в разработке)
- Friend ошибка (в разработке) 
- Создание подмены (активен)

## 📁 Структура проекта
```
├── frontend/          # Frontend на Netlify
├── backend/           # Backend на Render.com
└── README.md
```

## 🛠️ Установка и запуск

### Frontend (разработка):
```bash
cd frontend
# Запуск с live-server
npx live-server
```

### Backend:
```bash
cd backend
npm install
npm run dev
```

## 🔧 Настройка .env

Скопируйте `.env` в папке backend и заполните своими данными:
- Steam API ключи
- Данные аккаунта для подмены
- Пароли и секретные ключи

## 📦 Деплой

### Frontend (Netlify):
1. Подключить GitHub репозиторий
2. Build directory: `frontend`
3. Настроить редиректы для API

### Backend (Render.com):
1. Подключить GitHub репозиторий
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`

## 🔐 Безопасность
- Все секретные данные в .env файлах
- .env файлы в .gitignore
- Использовать HTTPS в продакшене
