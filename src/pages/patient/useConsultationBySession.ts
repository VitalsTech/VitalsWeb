import { useCallback, useEffect, useState } from 'react';
import {
  consultationsApi,
  getConsultationId,
  normalizeMessages,
  type ConsultationDto,
} from '@/api/consultations';
import { formatApiError } from '@/api/http';
import type { ChatMessage } from '@/types/chat';
import { toChatMessage } from '@/lib/chatMessage';
import { nextId } from '@/lib/id';

/**
 * Открывает конкретную консультацию по sessionId: get → join → messages.
 * Не вызывает `/active` и не создаёт новую сессию.
 */
export function useConsultationBySession(sessionId: string | undefined) {
  const [consultation, setConsultation] = useState<ConsultationDto | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (id: string, markAsRead = true) => {
    const response = await consultationsApi.getMessages(id, 0, { markAsRead });
    const list = normalizeMessages(response);
    setMessages(list.map((m, i) => toChatMessage(m, `m-${i}`, 'patient')));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const session = await consultationsApi.get(sessionId!);
        const id = getConsultationId(session) ?? sessionId!;
        if (!cancelled) setConsultation(session);
        await consultationsApi.join(id, 'patient').catch(() => {});
        await loadMessages(id, true);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err, 'Не удалось открыть консультацию.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [sessionId, loadMessages]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      void loadMessages(sessionId, true).catch(() => {});
    }, 2000);
    return () => window.clearInterval(timer);
  }, [sessionId, loadMessages]);

  const send = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return;
      setSending(true);
      setError(null);
      const optimistic: ChatMessage = {
        id: nextId('u'),
        from: 'user',
        text,
        isMine: true,
        sentAt: new Date().toISOString(),
        readAt: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        await consultationsApi.sendMessage(sessionId, { messageType: 'text', content: text });
        await loadMessages(sessionId, false);
      } catch (err) {
        setError(formatApiError(err, 'Не удалось отправить сообщение.'));
      } finally {
        setSending(false);
      }
    },
    [sessionId, loadMessages],
  );

  return { consultation, messages, loading, sending, error, send };
}
