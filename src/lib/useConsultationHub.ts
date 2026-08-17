import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from '@microsoft/signalr';
import { getApiBaseUrl } from '@/api/http';
import { getAccessToken } from '@/api/tokenStore';
import type {
  ClinicalActionDto,
  ConsultationMessageDto,
  RtcSignal,
  RtcSignalEvent,
  RtcSignalType,
} from '@/api/consultations';

export type ConsultationHubHandlers = {
  onMessage?: (message: ConsultationMessageDto) => void;
  onStatusChanged?: (status: string, sessionId: string) => void;
  onMessagesRead?: (payload: {
    sessionId?: string;
    readerRole?: string;
    readAt?: string;
    lastSequence?: number;
  }) => void;
  onVideoStarted?: () => void;
  onVideoStopped?: () => void;
  onRtcSignal?: (signal: RtcSignalEvent) => void;
  onClinicalAction?: (action: ClinicalActionDto) => void;
};

export type ConsultationHub = {
  ready: boolean;
  error: string | null;
  sendRtcSignal: (signal: RtcSignal) => Promise<void>;
  subscribe: (handlers: ConsultationHubHandlers) => () => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}

function parseRtcSignal(raw: unknown): RtcSignalEvent {
  const obj = asRecord(raw);
  const type = String(pickString(obj, 'type', 'Type') ?? '').toLowerCase() as RtcSignalType;
  const mLine = obj.sdpMLineIndex ?? obj.SdpMLineIndex;
  return {
    sessionId: pickString(obj, 'sessionId', 'SessionId'),
    fromUserId: pickString(obj, 'fromUserId', 'FromUserId'),
    type,
    sdp: pickString(obj, 'sdp', 'Sdp'),
    candidate: pickString(obj, 'candidate', 'Candidate'),
    sdpMid: pickString(obj, 'sdpMid', 'SdpMid'),
    sdpMLineIndex: typeof mLine === 'number' ? mLine : undefined,
    audio: typeof obj.audio === 'boolean' ? obj.audio : typeof obj.Audio === 'boolean' ? obj.Audio : undefined,
    video: typeof obj.video === 'boolean' ? obj.video : typeof obj.Video === 'boolean' ? obj.Video : undefined,
  };
}

export function useConsultationHub(sessionId: string | null | undefined): ConsultationHub {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const sessionRef = useRef(sessionId);
  const listenersRef = useRef(new Set<ConsultationHubHandlers>());

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const emit = useCallback((fn: (handler: ConsultationHubHandlers) => void) => {
    listenersRef.current.forEach(fn);
  }, []);

  useEffect(() => {
    if (!sessionId || !getAccessToken()) {
      return;
    }

    const hubUrl = `${getApiBaseUrl()}/api/v1/consultations/hub`;
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() ?? '',
        transport: HttpTransportType.WebSockets,
        // Gateway CORS is AllowAnyOrigin; SignalR's default credentials:true fails the handshake.
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('messageReceived', (message: ConsultationMessageDto) => {
      emit((handler) => handler.onMessage?.(message));
    });
    connection.on('statusChanged', (payload: unknown) => {
      const obj = asRecord(payload);
      const status = pickString(obj, 'status', 'Status') ?? '';
      const id = pickString(obj, 'sessionId', 'SessionId') ?? sessionId;
      emit((handler) => handler.onStatusChanged?.(status, id));
    });
    connection.on('messagesRead', (payload: unknown) => {
      const obj = asRecord(payload);
      emit((handler) =>
        handler.onMessagesRead?.({
          sessionId: pickString(obj, 'sessionId', 'SessionId'),
          readerRole: pickString(obj, 'readerRole', 'ReaderRole'),
          readAt: pickString(obj, 'readAt', 'ReadAt'),
          lastSequence: typeof obj.lastSequence === 'number' ? obj.lastSequence : undefined,
        }),
      );
    });
    connection.on('videoStarted', () => {
      emit((handler) => handler.onVideoStarted?.());
    });
    connection.on('videoStopped', () => {
      emit((handler) => handler.onVideoStopped?.());
    });
    connection.on('rtcSignal', (payload: unknown) => {
      emit((handler) => handler.onRtcSignal?.(parseRtcSignal(payload)));
    });
    connection.on('clinicalAction', (action: ClinicalActionDto) => {
      emit((handler) => handler.onClinicalAction?.(action));
    });

    const join = async () => {
      if (connection.state !== HubConnectionState.Connected) return;
      await connection.invoke('JoinSession', sessionId);
      setConnected(true);
      setError(null);
    };

    connection.onreconnected(() => {
      void join().catch(() => {
        setConnected(false);
        setError('Потеряно соединение с сервером звонка.');
      });
    });
    connection.onclose(() => setConnected(false));

    let cancelled = false;
    void connection
      .start()
      .then(() => {
        if (cancelled) return;
        return join();
      })
      .catch(() => {
        if (cancelled) return;
        setConnected(false);
        setError('Нет связи с сервером звонка. Перезапустите API Gateway и обновите страницу.');
      });

    return () => {
      cancelled = true;
      setConnected(false);
      connectionRef.current = null;
      void connection.invoke('LeaveSession', sessionId).catch(() => {});
      void connection.stop().catch(() => {});
    };
  }, [sessionId, emit]);

  const sendRtcSignal = useCallback(async (signal: RtcSignal) => {
    const connection = connectionRef.current;
    const id = sessionRef.current;
    if (!connection || !id || connection.state !== HubConnectionState.Connected) return;
    await connection.invoke('SendRtcSignal', id, signal);
  }, []);

  const subscribe = useCallback((handlers: ConsultationHubHandlers) => {
    listenersRef.current.add(handlers);
    return () => {
      listenersRef.current.delete(handlers);
    };
  }, []);

  return useMemo(
    () => ({
      ready: Boolean(sessionId) && connected,
      error: sessionId ? error : null,
      sendRtcSignal,
      subscribe,
    }),
    [connected, error, sendRtcSignal, sessionId, subscribe],
  );
}
