# Vitals — интерфейс пациента

Демо-интерфейс пациента цифровой медицинской экосистемы Vitals. Свёрстан по макету в Figma
(React + TypeScript + Vite + Tailwind CSS v4 + React Router). Без бэкенда — все данные мокнуты
локально, авторизация и API будут подключены на следующем этапе по отдельному контракту.

## Стек

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router v7
- Тема: light/dark через CSS-переменные и класс `.dark` на `<html>`, переключатель в сайдбаре

## Запуск

```bash
npm install
npm run dev
```

## Структура

- `src/pages/patient` — экраны пациента (маршрут, ИИ-триаж, документы, врачи, профиль, поддержка и т.д.)
- `src/layouts` — каркас с сайдбаром
- `src/components/ui` — базовые UI-примитивы (Button, Card, Input и т.д.)
- `src/mock` — локальные мок-данные (без бэкенда)
- `src/theme` — провайдер темы light/dark
