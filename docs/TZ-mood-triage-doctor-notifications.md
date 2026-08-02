# ТЗ: уведомления о самочувствии и результат ИИ-триажа для врача

## Контекст

Пациентский портал уже:

- пишет отметку самочувствия в медкарту: `POST /api/v1/medical-records/patients/{patientId}/events` с `eventType: mood_check`;
- показывает врачу последний триаж и самочувствие из `GET .../history`, **если** события корректно сохранены.

Сейчас **не гарантировано бэкендом**:

1. уведомление врачу при отметке самочувствия;
2. полноценная публикация результата триажа в медкарту / доступ врача к сессии триажа;
3. связь «пациент ↔ наблюдающие врачи» для доставки уведомлений.

---

## Разделение ответственности

| Задача | Фронт (сделано / делает портал) | Бэкенд (нужно сделать) |
|---|---|---|
| UI отметок «Стало лучше / Без изменений / Стало хуже» | Да | — |
| Запись `mood_check` в медкарту | Да | Принять и сохранить payload |
| Показ триажа и самочувствия в карточке пациента | Да (читает history) | Гарантировать события и полноту payload |
| Push / in-app уведомление врачу об отметке | Фильтр категории «Самочувствие» | **Создать и доставить** notification |
| Уведомление врачу о завершённом триаже | Фильтр «Триаж» | **Создать и доставить** notification |
| Обновление «маршрута» по mood/triage | Отображает | Бизнес-логика маршрута / state |

---

## 1. Отметка самочувствия → уведомление врачу

### 1.1. Входящее событие (уже шлёт фронт)

```http
POST /api/v1/medical-records/patients/{patientId}/events
Authorization: Bearer <patient>
Content-Type: application/json

{
  "eventType": "mood_check",
  "sourceService": "patient-portal",
  "occurredAt": "2026-07-23T10:15:00.000Z",
  "payloadJson": "{\"mood\":\"Стало хуже\",\"moodCode\":\"worse\",\"severity\":3,\"notifyDoctor\":true,\"escalate\":true}"
}
```

Поля payload:

| Поле | Тип | Значения | Смысл |
|---|---|---|---|
| `mood` | string | `Стало лучше` / `Без изменений` / `Стало хуже` | Текст для UI |
| `moodCode` | string | `better` / `same` / `worse` | Стабильный код |
| `severity` | int | `1` / `2` / `3` | Уровень серьёзности |
| `notifyDoctor` | bool | обычно `true` | Явный флаг уведомления |
| `escalate` | bool | `true` при `worse` | Приоритет / срочность |

Обратная совместимость: поддерживать и старые payload `{ "mood": "Хорошо" }` / `moodCode: "good"|"tired"`.

### 1.2. Требование

После успешной записи `mood_check` (и/или `VitalSignRecorded`, если бэк мапит так):

1. Определить получателей-врачей (см. §3).
2. Создать уведомление каждому получателю.
3. Доставить через существующий Notifications pipeline (history + push, если есть токен).

### 1.3. Формат уведомления

Рекомендуемые поля:

```json
{
  "category": "mood",
  "title": "Самочувствие пациента",
  "message": "Пациент Анна отметила: «Стало хуже»",
  "patientId": "<uuid>",
  "eventType": "mood_check",
  "severity": 3,
  "deepLink": "/doctor/patients/<patientId>"
}
```

Правила текста:

- `better` → обычный приоритет, title «Самочувствие пациента»;
- `same` → обычный/средний;
- `worse` / `escalate=true` → повышенный приоритет, в тексте явно «Стало хуже», желательно `priority: high`.

### 1.4. Критерии приёмки

- [ ] После клика пациента «Стало хуже» у врача появляется запись в `GET /api/v1/notifications/history`.
- [ ] В уведомлении есть `patientId` (или эквивалент), чтобы открыть карточку.
- [ ] `severity=1` тоже создаёт уведомление (не только escalate), если `notifyDoctor=true`.
- [ ] Идемпотентность: повторная отправка того же event id не дублирует notification (желательно).

---

## 2. Результат ИИ-триажа → видимость врачу + уведомление

### 2.1. Проблема

Врач на портале читает результат из history (`AiTriageUrgencyDetermined` / `triage_session`). Если сервис триажа не публикует событие в Medical Records с полным payload, карточка врача пустая.

### 2.2. Требование A — публикация в медкарту

При `complete` сессии триажа (или когда определён urgency/recommendation) Medical Records должен получить событие:

```json
{
  "eventType": "AiTriageUrgencyDetermined",
  "sourceService": "triage-service",
  "occurredAt": "<iso>",
  "payloadJson": {
    "sessionId": "<uuid>",
    "urgencyLevel": 4,
    "recommendedSpecialization": "Кардиолог",
    "recommendation": "Текст рекомендации для врача и пациента",
    "route": ["ИИ-триаж", "Консультация кардиолога", "Анализы", "Рецепт"],
    "canBeRemote": true
  }
}
```

Минимально обязательные поля: `sessionId`, `urgencyLevel`, `recommendedSpecialization`, `recommendation`.

### 2.3. Требование B — API для врача (желательно)

Добавить один из вариантов:

**Вариант 1 (предпочтительный):**

```http
GET /api/v1/triage/patients/{patientId}/sessions?limit=5
Authorization: Bearer <doctor>
```

Возвращает список сессий с итоговой оценкой (без необходимости знать `sessionId`).

**Вариант 2:**

```http
GET /api/v1/triage/sessions/{sessionId}
```

доступен роли Doctor, если есть grant/связь с пациентом.

### 2.4. Требование C — уведомление врачу о триаже

После финализации триажа:

```json
{
  "category": "triage",
  "title": "Новый результат ИИ-триажа",
  "message": "Пациент Анна · срочность: Скоро · рекомендован кардиолог",
  "patientId": "<uuid>",
  "sessionId": "<uuid>",
  "urgencyLevel": 4,
  "deepLink": "/doctor/patients/<patientId>"
}
```

Для `urgencyLevel >= 4` — высокий приоритет / push обязателен (если токен есть).

### 2.5. Критерии приёмки

- [ ] После завершения триажа пациентом в `GET .../medical-records/patients/{id}/history` есть событие с recommendation.
- [ ] В карточке врача на портале блок «Результат ИИ-триажа» заполняется без ручных костылей.
- [ ] Врач получает notification категории triage.
- [ ] Doctor без доступа к пациенту не читает чужие triage sessions (403).

---

## 3. Кому слать уведомления (адресация)

Нужна явная политика получателей. Рекомендация:

1. Все врачи с активным access-grant на пациента; **или**
2. Врач(и) из активной/последней консультации; **или**
3. Врачи, у которых пациент в «наблюдении» (если появится такой сервис).

Зафиксировать в коде один источник истины. Для MVP достаточно:  
**врачи с непросроченным access-grant + врач последней консультации (union).**

Если получателей 0:

- событие в медкарте всё равно сохраняется;
- notification не создаётся (или кладётся в dead-letter / admin log);
- метрика `mood_notify_no_recipients`.

---

## 4. Preferences

В `GET/PUT /api/v1/notifications/preferences` добавить/поддержать категории:

- `mood` (самочувствие)
- `triage` (результаты триажа)

По умолчанию для роли Doctor: оба `pushEnabled=true`.

Учитывать preferences при доставке.

---

## 5. Нефункциональные требования

- Latency: notification создаётся в течение **≤ 5 с** после commit события.
- Аудит: связать `notificationId` ↔ `medicalRecordEventId`.
- Безопасность: врач видит только своих пациентов; patientId в deep link проверяется на доступе.
- Логирование: `moodCode`, `severity`, `patientId`, `recipientDoctorIds` (без ПДн сверх необходимого).

---

## 6. Вне скоупа фронта (не делать на UI)

- Не эмулировать уведомления локально.
- Не писать «фейковые» triage results в UI, если history пустой.
- Не выбирать pharmacy/doctor recipients на клиенте.

---

## 7. Порядок внедрения (бэкенд)

1. Consumer/handler на `mood_check` → notify doctors.  
2. Публикация `AiTriageUrgencyDetermined` при complete триажа (полный payload).  
3. Notify on triage complete.  
4. (Опционально) `GET /triage/patients/{id}/sessions` для врача.  
5. Preferences `mood` / `triage`.

---

## 8. Контракт для ручной проверки

```bash
# 1) Пациент ставит отметку (через портал или curl)
# 2) Врач:
curl -H "Authorization: Bearer $DOCTOR_TOKEN" \
  "$GATEWAY/api/v1/notifications/history?limit=20"

curl -H "Authorization: Bearer $DOCTOR_TOKEN" \
  "$GATEWAY/api/v1/medical-records/patients/$PATIENT_ID/history"
```

Ожидание: в history врача есть mood/triage notification; в medical-records history есть `mood_check` и `AiTriageUrgencyDetermined` с recommendation.
