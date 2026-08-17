import { useCallback, useEffect, useRef, useState } from 'react';
import {
  consultationsApi,
  isConsultationVideoActive,
  type IceServerDto,
  type RtcSignalEvent,
  type VideoRoomResponse,
} from '@/api/consultations';
import { ApiError, formatApiError } from '@/api/http';
import type { ConsultationHub } from './useConsultationHub';
import { useSpeaking } from './useSpeaking';

export type VideoPhase = 'idle' | 'starting' | 'incall' | 'stopping' | 'denied';

export type ConsultationVideo = {
  phase: VideoPhase;
  incomingInvite: boolean;
  error: string | null;
  sfuUnavailable: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  localSpeaking: boolean;
  remoteSpeaking: boolean;
  start: () => Promise<void>;
  join: () => Promise<void>;
  stop: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
};

function toIceServers(servers: IceServerDto[] | undefined): RTCIceServer[] {
  return (servers ?? [])
    .map((raw) => {
      const server = raw as IceServerDto & {
        Urls?: string | string[];
        Username?: string;
        Credential?: string;
      };
      return {
        urls: server.urls ?? server.Urls ?? '',
        username: server.username ?? server.Username,
        credential: server.credential ?? server.Credential,
      };
    })
    .filter((server) => (Array.isArray(server.urls) ? server.urls.length > 0 : Boolean(server.urls)));
}

function stopTracks(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function mediaErrorMessage(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Нет доступа к камере или микрофону. Разрешите доступ в браузере — чат при этом доступен.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Камера или микрофон не найдены. Чат доступен без видео.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Камера занята другим приложением. Чат доступен без видео.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Не удалось включить камеру. Чат доступен без видео.';
}

async function fetchRoom(sessionId: string, asInitiator: boolean): Promise<VideoRoomResponse> {
  if (asInitiator) return consultationsApi.startVideo(sessionId);
  try {
    return await consultationsApi.getVideo(sessionId);
  } catch (error) {
    const inactive =
      (error instanceof ApiError && error.status === 409) ||
      (error instanceof Error && /not active/i.test(error.message));
    if (inactive) return consultationsApi.startVideo(sessionId);
    throw error;
  }
}

export function useConsultationVideo({
  sessionId,
  hub,
  polite,
  enabled,
}: {
  sessionId: string | null | undefined;
  hub: ConsultationHub;
  polite: boolean;
  enabled: boolean;
}): ConsultationVideo {
  const [phase, setPhase] = useState<VideoPhase>('idle');
  const [incomingInvite, setIncomingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sfuUnavailable, setSfuUnavailable] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const phaseRef = useRef<VideoPhase>('idle');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const localIceRef = useRef<Array<{ candidate?: string; sdpMid?: string; sdpMLineIndex?: number }>>(
    [],
  );
  const pendingSignalsRef = useRef<RtcSignalEvent[]>([]);
  const makingOfferRef = useRef(false);
  const initiatorRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const offerTimerRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);
  const sendRtcRef = useRef(hub.sendRtcSignal);
  const sessionRef = useRef(sessionId);
  const handleSignalRef = useRef<(signal: RtcSignalEvent) => Promise<void>>(async () => {});

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    sendRtcRef.current = hub.sendRtcSignal;
  }, [hub.sendRtcSignal]);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const clearOfferTimer = useCallback(() => {
    if (offerTimerRef.current != null) {
      window.clearTimeout(offerTimerRef.current);
      offerTimerRef.current = null;
    }
  }, []);

  const teardownMedia = useCallback(() => {
    clearOfferTimer();
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      try {
        pc.close();
      } catch {
        /* already closed */
      }
    }
    stopTracks(localRef.current);
    localRef.current = null;
    pendingIceRef.current = [];
    localIceRef.current = [];
    pendingSignalsRef.current = [];
    makingOfferRef.current = false;
    initiatorRef.current = false;
    ignoreOfferRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setAudioEnabled(true);
    setVideoEnabled(true);
  }, [clearOfferTimer]);

  const flushIce = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingIceRef.current.splice(0);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* remote description may still be settling */
      }
    }
  }, []);

  const createOffer = useCallback(async (pc: RTCPeerConnection) => {
    if (pc.signalingState !== 'stable') return;
    makingOfferRef.current = true;
    try {
      await pc.setLocalDescription(await pc.createOffer());
      const sdp = pc.localDescription?.sdp;
      if (sdp) await sendRtcRef.current({ type: 'offer', sdp });
    } finally {
      makingOfferRef.current = false;
    }
  }, []);

  const replayLocalIce = useCallback(async () => {
    for (const ice of localIceRef.current) {
      await sendRtcRef.current({ type: 'ice', ...ice });
    }
  }, []);

  const negotiateOnPeerReady = useCallback(
    async (pc: RTCPeerConnection) => {
      if (pc.remoteDescription) return;
      if (pc.signalingState === 'have-local-offer' && pc.localDescription?.sdp) {
        await sendRtcRef.current({ type: 'offer', sdp: pc.localDescription.sdp });
        await replayLocalIce();
        return;
      }
      if (pc.signalingState === 'stable' && (initiatorRef.current || !polite)) {
        await createOffer(pc);
      }
    },
    [createOffer, polite, replayLocalIce],
  );

  const attachPeer = useCallback(
    (iceServers: IceServerDto[] | undefined, stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers: toIceServers(iceServers) });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const payload = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid ?? undefined,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
        };
        localIceRef.current.push(payload);
        void sendRtcRef.current({ type: 'ice', ...payload });
      };

      pc.ontrack = (event) => {
        setRemoteStream((prev) => {
          const tracks = prev ? [...prev.getTracks()] : [];
          if (!tracks.includes(event.track)) tracks.push(event.track);
          return new MediaStream(tracks);
        });
      };

      return pc;
    },
    [],
  );

  const connect = useCallback(
    async (asInitiator: boolean) => {
      const id = sessionRef.current;
      if (!id || !enabled) return;
      if (phaseRef.current === 'starting' || phaseRef.current === 'incall') return;

      stoppingRef.current = false;
      setIncomingInvite(false);
      setError(null);
      setSfuUnavailable(false);
      setPhase('starting');
      initiatorRef.current = asInitiator;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (stoppingRef.current) {
          stopTracks(stream);
          return;
        }
        localRef.current = stream;
        setLocalStream(stream);
        setAudioEnabled(true);
        setVideoEnabled(true);

        const room = await fetchRoom(id, asInitiator);
        const mode = String(
          room.mode ?? (room as VideoRoomResponse & { Mode?: string }).Mode ?? 'p2p',
        ).toLowerCase();
        if (mode === 'sfu') {
          stopTracks(stream);
          localRef.current = null;
          setLocalStream(null);
          setSfuUnavailable(true);
          setPhase('idle');
          return;
        }

        const iceServers =
          room.iceServers ?? (room as VideoRoomResponse & { IceServers?: IceServerDto[] }).IceServers;
        attachPeer(iceServers, stream);
        const queued = pendingSignalsRef.current.splice(0);
        for (const signal of queued) {
          await handleSignalRef.current(signal);
        }
        await sendRtcRef.current({ type: 'media', audio: true, video: true });
        clearOfferTimer();
        offerTimerRef.current = window.setTimeout(() => {
          const current = pcRef.current;
          if (!current || current.remoteDescription) return;
          if (current.signalingState === 'stable' && (initiatorRef.current || !polite)) {
            void createOffer(current);
          }
        }, 2000);
        setPhase('incall');
      } catch (err) {
        teardownMedia();
        if (err && typeof err === 'object' && 'name' in err) {
          const name = String(err.name);
          if (
            name === 'NotAllowedError' ||
            name === 'PermissionDeniedError' ||
            name === 'NotFoundError' ||
            name === 'DevicesNotFoundError' ||
            name === 'NotReadableError' ||
            name === 'TrackStartError'
          ) {
            setError(mediaErrorMessage(err));
            setPhase('denied');
            return;
          }
        }
        setError(formatApiError(err, 'Не удалось начать видео.'));
        setPhase('idle');
      }
    },
    [attachPeer, clearOfferTimer, createOffer, enabled, polite, teardownMedia],
  );

  const start = useCallback(() => connect(true), [connect]);
  const join = useCallback(() => connect(false), [connect]);

  const stop = useCallback(async () => {
    const id = sessionRef.current;
    if (phaseRef.current === 'idle' || phaseRef.current === 'stopping') {
      setIncomingInvite(false);
      return;
    }
    stoppingRef.current = true;
    setPhase('stopping');
    setIncomingInvite(false);
    try {
      await sendRtcRef.current({ type: 'hangup' });
    } catch {
      /* hub may already be down */
    }
    teardownMedia();
    if (id) {
      try {
        await consultationsApi.stopVideo(id);
      } catch {
        /* room may already be closed */
      }
    }
    setPhase('idle');
  }, [teardownMedia]);

  const handleSignal = useCallback(
    async (signal: RtcSignalEvent) => {
      const type = signal.type;
      if (!type) return;

      if (type === 'hangup') {
        if (phaseRef.current === 'idle') return;
        stoppingRef.current = true;
        teardownMedia();
        setPhase('idle');
        setIncomingInvite(false);
        return;
      }

      const pc = pcRef.current;
      if (!pc) {
        pendingSignalsRef.current.push(signal);
        return;
      }

      if (type === 'media') {
        void negotiateOnPeerReady(pc);
        return;
      }

      if (type === 'ice') {
        const candidate: RTCIceCandidateInit = {
          candidate: signal.candidate,
          sdpMid: signal.sdpMid,
          sdpMLineIndex: signal.sdpMLineIndex,
        };
        if (!pc.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          /* stale candidate */
        }
        return;
      }

      if (type === 'offer' && signal.sdp) {
        const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
        ignoreOfferRef.current = !polite && offerCollision;
        if (ignoreOfferRef.current) return;
        if (offerCollision && polite) {
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch {
            /* rollback is optional */
          }
        }
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
        await flushIce(pc);
        await pc.setLocalDescription(await pc.createAnswer());
        const sdp = pc.localDescription?.sdp;
        if (sdp) await sendRtcRef.current({ type: 'answer', sdp });
        clearOfferTimer();
        return;
      }

      if (type === 'answer' && signal.sdp) {
        if (ignoreOfferRef.current) return;
        await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
        await flushIce(pc);
        clearOfferTimer();
      }
    },
    [clearOfferTimer, flushIce, negotiateOnPeerReady, polite, teardownMedia],
  );
  handleSignalRef.current = handleSignal;

  const toggleAudio = useCallback(() => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    localRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    void sendRtcRef.current({ type: 'media', audio: next, video: videoEnabled });
  }, [audioEnabled, videoEnabled]);

  const toggleVideo = useCallback(() => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    localRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    void sendRtcRef.current({ type: 'media', audio: audioEnabled, video: next });
  }, [audioEnabled, videoEnabled]);

  useEffect(() => {
    return hub.subscribe({
      onVideoStarted: () => {
        if (phaseRef.current === 'idle') setIncomingInvite(true);
      },
      onVideoStopped: () => {
        setIncomingInvite(false);
        if (phaseRef.current === 'idle' || phaseRef.current === 'stopping') {
          if (phaseRef.current === 'stopping') setPhase('idle');
          return;
        }
        stoppingRef.current = true;
        teardownMedia();
        setPhase('idle');
      },
      onRtcSignal: (signal) => {
        void handleSignal(signal);
      },
    });
  }, [hub, handleSignal, teardownMedia]);

  useEffect(() => {
    if (!sessionId || !enabled) return;
    let cancelled = false;
    void consultationsApi
      .get(sessionId)
      .then((consultation) => {
        if (cancelled) return;
        if (isConsultationVideoActive(consultation) && phaseRef.current === 'idle') {
          setIncomingInvite(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId, enabled]);

  useEffect(() => {
    if (enabled) return;
    if (phaseRef.current !== 'idle') void stop();
  }, [enabled, stop]);

  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      const id = sessionRef.current;
      const wasLive = phaseRef.current === 'incall' || phaseRef.current === 'starting';
      teardownMedia();
      if (wasLive && id) {
        void sendRtcRef.current({ type: 'hangup' }).catch(() => {});
        void consultationsApi.stopVideo(id).catch(() => {});
      }
    };
  }, [sessionId, teardownMedia]);

  const inCall = phase === 'incall';
  const localSpeaking = useSpeaking(localStream, inCall && audioEnabled);
  const remoteSpeaking = useSpeaking(remoteStream, inCall);

  return {
    phase,
    incomingInvite,
    error,
    sfuUnavailable,
    localStream,
    remoteStream,
    audioEnabled,
    videoEnabled,
    localSpeaking,
    remoteSpeaking,
    start,
    join,
    stop,
    toggleAudio,
    toggleVideo,
  };
}
