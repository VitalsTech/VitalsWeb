import { useCallback, useEffect, useState } from 'react';
import { triageApi, getSessionId } from '@/api/triage';
import type { TriageMessageDto, TriageSessionDto } from '@/api/triage';
import type { ChatMessage } from '@/types/chat';
import { nextId } from '@/lib/id';

function storageKey(patientId: string) {
  return `vitals.triageSessionId.${patientId}`;
}

function toChatMessage(dto: TriageMessageDto, fallbackId: string): ChatMessage {
  const role = String(dto.role ?? dto.from ?? dto.sender ?? 'ai').toLowerCase();
  const from: ChatMessage['from'] = role.includes('user') || role.includes('patient') ? 'user' : 'ai';
  return { id: String(dto.id ?? fallbackId), from, text: String(dto.content ?? dto.text ?? '') };
}

/**
 * Shared triage-session state used by both the guided "ИИ-триаж" flow and
 * the free-form "Чат с ИИ" screen — the contract only exposes one Triage
 * session concept, so both UIs are views over the same backend session.
 */
export function useTriageSession(patientId: string | null) {
  const [sessionId, setSessionId] = useState<string | null>(() =>
    patientId ? window.localStorage.getItem(storageKey(patientId)) : null,
  );
  const [session, setSession] = useState<TriageSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((next: TriageSessionDto) => {
    setSession(next);
    if (Array.isArray(next.messages) && next.messages.length > 0) {
      setMessages(next.messages.map((m, i) => toChatMessage(m, `s-${i}`)));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await triageApi.getSession(sessionId);
      applySession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить сессию триажа.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, applySession]);

  useEffect(() => {
    if (sessionId) void refresh();
  }, [sessionId, refresh]);

  const send = useCallback(
    async (text: string) => {
      if (!patientId || !text.trim()) return;
      setSending(true);
      setError(null);

      const optimisticUser: ChatMessage = { id: nextId('u'), from: 'user', text };
      setMessages((prev) => [...prev, optimisticUser]);

      try {
        if (!sessionId) {
          const created = await triageApi.createSession({ patientId, chiefComplaint: text, locale: 'ru' });
          const createdId = getSessionId(created);
          if (createdId) {
            window.localStorage.setItem(storageKey(patientId), createdId);
            setSessionId(createdId);
          }
          applySession(created);
        } else {
          const reply = await triageApi.sendMessage(sessionId, text);
          const maybeSession = reply as TriageSessionDto;
          if (Array.isArray(maybeSession.messages)) {
            applySession(maybeSession);
          } else {
            const maybeMessage = reply as TriageMessageDto;
            if (maybeMessage && (maybeMessage.content || maybeMessage.text)) {
              setMessages((prev) => [...prev, toChatMessage(maybeMessage, nextId('a'))]);
            }
            // Reconcile with backend state regardless of what the POST returned.
            const refreshed = await triageApi.getSession(sessionId);
            applySession(refreshed);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение.');
      } finally {
        setSending(false);
      }
    },
    [patientId, sessionId, applySession],
  );

  const hasRouting = Boolean(
    session?.urgency || session?.urgencyLevel || session?.recommendation || session?.recommendationText,
  );

  return { sessionId, session, messages, loading, sending, error, send, refresh, hasRouting };
}
