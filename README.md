# Vitals — интерфейс пациента

Интерфейс пациента цифровой медицинской экосистемы Vitals. Свёрстан по макету в Figma (React +
TypeScript + Vite + Tailwind CSS v4 + React Router) и подключён к API Gateway Vitals по контракту
(`contract.txt`, OpenAPI).

## Стек

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router v7
- Тема: light/dark через CSS-переменные и класс `.dark` на `<html>`, переключатель в сайдбаре

## Backend / API

- Контракт: OpenAPI-спецификация API Gateway (Auth, Users, Doctors, Triage, Consultations,
  MedicalRecords, Prescriptions, Notifications, Payments…).
- Все обращения к API описаны в `src/api/*`: `http.ts` — общий fetch-клиент с авто-обновлением
  токена (refresh) и обработкой ошибок, остальные файлы — по одному на тег контракта.
- Аутентификация — JWT Bearer. Токены и `publicId`/`patientId` хранятся в `localStorage`
  (`src/api/tokenStore.ts`); `publicId`/`patientId` при необходимости восстанавливаются из payload
  access-токена, так как ответы `/auth/login|register|refresh` не документированы контрактом
  (только `200 OK`), а сам JWT самодостаточен.
- Контракт не документирует тела ответов для GET-эндпоинтов — DTO в `src/api/*.ts` намеренно
  «мягкие» (опциональные поля + `[key: string]: unknown`), а компоненты страниц отрисовывают
  доступные поля с осмысленными заглушками, если чего-то нет.
- Несколько экранов используют `medical-records` events (`AppendEventRequestDto`) как универсальный
  журнал для сценариев, не имеющих отдельного эндпоинта в контракте (отметка самочувствия, вызов
  врача на дом, обращение в поддержку, карточки документов).
- Редактирование личных данных профиля (ФИО, дата рождения, телефон) недоступно — в контракте нет
  соответствующего эндпоинта; доступна только смена пароля (`/auth/change-password`).

### Настройка

Скопируйте `.env.example` в `.env.local` и укажите адрес API Gateway:

```bash
cp .env.example .env.local
# VITE_API_BASE_URL=https://api.vitals.example
```

Если оставить `VITE_API_BASE_URL` пустым, запросы уходят на тот же origin (`/api/v1/...`) —
удобно, если фронтенд обслуживается за реверс-прокси, который проксирует `/api` на гейтвей.

## Запуск

```bash
npm install
npm run dev
```

## Структура

- `src/api` — типизированный клиент API Gateway (по одному модулю на тег контракта) + хранение
  токенов
- `src/pages/patient` — экраны пациента (маршрут, ИИ-триаж, документы, врачи, профиль, поддержка и
  т.д.)
- `src/layouts` — каркас с сайдбаром
- `src/components/ui` — базовые UI-примитивы (Button, Card, Input и т.д.)
- `src/lib/useAsyncData.ts` — хук для загрузки данных с состояниями loading/error
- `src/theme` — провайдер темы light/dark
- `src/auth` — провайдер аутентификации (JWT, привязан к `src/api/auth.ts`)
