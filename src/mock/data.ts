export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  experienceYears: number;
  schedule: string;
  onlineAvailable: boolean;
  tag: string;
  bio: string;
};

export const doctors: Doctor[] = [
  {
    id: 'petrov',
    name: 'Пётров Артём Ильич',
    specialty: 'Терапевт',
    clinic: 'Vitals Clinic',
    experienceYears: 9,
    schedule: 'пн–пт 9:00–18:00',
    onlineAvailable: true,
    tag: 'наблюдающий врач',
    bio: 'Терапевт общей практики, ведёт наблюдение по хроническим состояниям и первичным обращениям.',
  },
  {
    id: 'fedorova',
    name: 'Фёдорова Инна Сергеевна',
    specialty: 'Кардиолог',
    clinic: 'Vitals Clinic',
    experienceYears: 12,
    schedule: 'пн–пт 9:00–18:00',
    onlineAvailable: true,
    tag: 'консультировала онлайн',
    bio: 'Специализация: кардиология, профилактика, наблюдение при гипертонии. Клиника-партнёр: Vitals Clinic, отделение терапии.',
  },
  {
    id: 'klimov',
    name: 'Климов Егор Михайлович',
    specialty: 'Уролог',
    clinic: 'Vitals Clinic',
    experienceYears: 7,
    schedule: 'вт, чт 10:00–19:00',
    onlineAvailable: false,
    tag: 'очная запись доступна',
    bio: 'Приём взрослых пациентов, диагностика и плановое наблюдение.',
  },
];

export type DocumentItem = {
  id: string;
  title: string;
  paper: string;
  digital: string;
  date: string;
};

export const documents: DocumentItem[] = [
  { id: 'doc-1', title: 'Справка для работы', paper: 'Скан', digital: 'FHIR PDF', date: '12.03.2026' },
  { id: 'doc-2', title: 'Выписка амб.', paper: 'Скан', digital: 'FHIR PDF', date: '01.03.2026' },
  { id: 'doc-3', title: 'Электронный рецепт', paper: '—', digital: 'FHIR PDF', date: '30.05.2026' },
];

export type NotificationItem = {
  id: string;
  title: string;
  date: string;
  isNew?: boolean;
};

export const notifications: NotificationItem[] = [
  { id: 'n-1', title: 'Напоминание о записи', date: 'сегодня, 09:12', isNew: true },
  { id: 'n-2', title: 'Рецепт готов к получению', date: 'вчера' },
  { id: 'n-3', title: 'Результаты анализов добавлены', date: '28.05' },
  { id: 'n-4', title: 'Новое сообщение от врача', date: '27.05' },
];

export const faqItems = [
  {
    q: 'Как подключить ЕСИА?',
    a: 'На экране входа выберите «Войти через ЕСИА» и подтвердите данные на Госуслугах.',
  },
  {
    q: 'Где мои результаты анализов?',
    a: 'Раздел «Документы» синхронизируется с клиникой и лабораторией после интеграции.',
  },
  {
    q: 'Как изменить записанный приём?',
    a: 'Раздел «Врачи» → карточка специалиста → управление записью или отмена.',
  },
];

export const careSteps = [
  {
    id: 'triage',
    title: '1. ИИ-триаж',
    description: 'Завершён · повышенное давление, рекомендован кардиолог',
    status: 'done' as const,
  },
  {
    id: 'consult',
    title: '2. Консультация кардиолога',
    description: 'Завтра 10:40 · Фёдорова И.С. · Vitals Clinic',
    status: 'current' as const,
  },
  {
    id: 'labs',
    title: '3. Анализы',
    description: 'Ожидают назначения после приёма',
    status: 'pending' as const,
  },
  {
    id: 'prescription',
    title: '4. Получение рецепта',
    description: 'Аптека-партнёр · после назначения врача',
    status: 'pending' as const,
  },
];

export const triageQuickPhrases = [
  'Стало хуже',
  'Нужна консультация',
  'После процедуры',
  'Высокая температура',
];

export type ChatMessage = {
  id: string;
  from: 'ai' | 'user' | 'doctor';
  text: string;
};

export const initialTriageMessages: ChatMessage[] = [
  { id: 'm1', from: 'ai', text: 'Здравствуйте! Что беспокоит сегодня?' },
  { id: 'm2', from: 'user', text: 'Нужна консультация по давлению' },
  { id: 'm3', from: 'ai', text: 'Поняла. Измерили ли давление сегодня?' },
  { id: 'm4', from: 'user', text: 'Давление 148/94, лёгкая головная боль' },
];

export const fullTriageMessages: ChatMessage[] = [
  {
    id: 'm1',
    from: 'ai',
    text: 'Здравствуйте! Что беспокоит сегодня? Можете выбрать фразу или написать своими словами.',
  },
  { id: 'm2', from: 'user', text: 'Нужна консультация по давлению' },
  { id: 'm3', from: 'ai', text: 'Поняла. Измерили ли давление сегодня? Есть ли головная боль?' },
  { id: 'm4', from: 'user', text: 'Давление 148/94, лёгкая головная боль' },
  { id: 'm5', from: 'ai', text: 'Спасибо. Рекомендую записаться к терапевту в течение 24 часов.' },
];

export const doctorChatMessages: ChatMessage[] = [
  { id: 'd1', from: 'doctor', text: 'Добрый день! Пришлите, пожалуйста, свежие показатели давления.' },
  { id: 'd2', from: 'user', text: 'Здравствуйте, доктор. Сегодня 148/94.' },
  { id: 'd3', from: 'doctor', text: 'Спасибо. Продолжайте приём назначенных препаратов.' },
];
