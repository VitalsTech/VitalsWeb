import { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { consultationsApi } from '@/api/consultations';
import { formatApiError } from '@/api/http';
import { cn } from '@/lib/cn';
import type { ConsultationVideo } from '@/lib/useConsultationVideo';
import { VideoConsentModal } from './VideoConsentModal';

function StreamVideo({
  stream,
  muted,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) void el.play().catch(() => {});
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

function IconMic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
    </svg>
  );
}

function IconMicOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.1 18.28 4.22 3.4 2.8 4.81l4.28 4.28A6.96 6.96 0 0 0 5 11h2c.1-.7.32-1.36.62-1.96L12.7 14.1A3 3 0 0 1 9.12 11.3L7.7 9.88A5 5 0 0 0 12 16a4.96 4.96 0 0 0 2.12-.47l1.46 1.46A6.97 6.97 0 0 1 13 17.92V21h-2v-3.08A7 7 0 0 1 5 11H3a9 9 0 0 0 8 8.95V23h2v-3.05c1.13-.16 2.2-.55 3.16-1.13l4.04 4.04 1.41-1.41-2.51-2.51ZM12 14c.1 0 .2 0 .3-.02l-3.16-3.16A3 3 0 0 0 12 14Zm0-10a3 3 0 0 1 3 3v4.17l2 2V7a5 5 0 0 0-8.9-3.1L9.6 5.4A3 3 0 0 1 12 4Z" />
    </svg>
  );
}

function IconCam(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 4v-11l-4 4Z" />
    </svg>
  );
}

function IconCamOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="m2.1 3.51 18.4 18.38 1.4-1.41L3.51 2.1 2.1 3.51ZM5 5.91 16.09 17H5a2 2 0 0 1-2-2V7c0-.35.1-.68.26-.97L5 5.91Zm12 4.59V7a2 2 0 0 0-2-2h-3.09l7.7 7.7L17 10.5Z" />
    </svg>
  );
}

function IconPhoneDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21 8.5c-4.6-3.3-13.4-3.3-18 0-.7.5-.8 1.5-.3 2.2l1.7 2.3c.4.6 1.2.8 1.9.5l2.2-1c.6-.3.9-.9.8-1.5l-.3-1.6c2.9-.8 6-.8 8.8 0l-.3 1.6c-.1.6.2 1.2.8 1.5l2.2 1c.7.3 1.5.1 1.9-.5l1.7-2.3c.5-.7.4-1.7-.3-2.2Z" />
    </svg>
  );
}

function IconExpand(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCollapse(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CircleControl({
  label,
  onClick,
  danger,
  off,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  off?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50',
        danger ? 'bg-[#ed4245]' : off ? 'bg-[#ed4245]' : 'bg-black/55 hover:bg-black/70',
      )}
    >
      {children}
    </button>
  );
}

function SpeakingFrame({
  speaking,
  className,
  children,
}: {
  speaking: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-md transition-[box-shadow] duration-150',
        speaking ? 'shadow-[0_0_0_3px_#23a55a,0_0_16px_rgba(35,165,90,0.55)]' : 'shadow-[0_0_0_3px_transparent]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function VideoCallPanel({
  video,
  sessionId,
  requireConsent,
  hubReady,
  hubError,
  disabled,
  theater,
  onTheaterChange,
  className,
}: {
  video: ConsultationVideo;
  sessionId: string | null | undefined;
  requireConsent: boolean;
  hubReady: boolean;
  hubError?: string | null;
  disabled?: boolean;
  theater?: boolean;
  onTheaterChange?: (next: boolean) => void;
  className?: string;
}) {
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'start' | 'join' | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  const inCall = video.phase === 'incall';
  const busy = video.phase === 'starting' || video.phase === 'stopping';
  const canControl = !disabled && Boolean(sessionId);

  function requestCall(action: 'start' | 'join') {
    if (!canControl) return;
    if (requireConsent) {
      setPendingAction(action);
      setConsentOpen(true);
      return;
    }
    void (action === 'join' ? video.join() : video.start());
  }

  async function confirmConsent(videoRecordingConsent: boolean) {
    if (!sessionId || !pendingAction) return;
    setConsentError(null);
    try {
      await consultationsApi.consent(sessionId, true, videoRecordingConsent);
      setConsentOpen(false);
      const action = pendingAction;
      setPendingAction(null);
      await (action === 'join' ? video.join() : video.start());
    } catch (error) {
      setConsentError(formatApiError(error, 'Не удалось сохранить согласие.'));
    }
  }

  const controls = inCall ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-sm">
        <CircleControl
          label={video.audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          off={!video.audioEnabled}
          onClick={video.toggleAudio}
        >
          {video.audioEnabled ? <IconMic className="h-5 w-5" /> : <IconMicOff className="h-5 w-5" />}
        </CircleControl>
        <CircleControl
          label={video.videoEnabled ? 'Выключить камеру' : 'Включить камеру'}
          off={!video.videoEnabled}
          onClick={video.toggleVideo}
        >
          {video.videoEnabled ? <IconCam className="h-5 w-5" /> : <IconCamOff className="h-5 w-5" />}
        </CircleControl>
        {onTheaterChange && (
          <CircleControl
            label={theater ? 'Свернуть видео' : 'На весь экран'}
            onClick={() => onTheaterChange(!theater)}
          >
            {theater ? <IconCollapse className="h-5 w-5" /> : <IconExpand className="h-5 w-5" />}
          </CircleControl>
        )}
        <CircleControl label="Завершить видео" danger disabled={busy} onClick={() => void video.stop()}>
          <IconPhoneDown className="h-5 w-5" />
        </CircleControl>
      </div>
    </div>
  ) : null;

  return (
    <Card className={cn('relative overflow-hidden', theater && 'flex h-full min-h-0 flex-col border-0 bg-transparent', className)}>
      <div className={cn('relative bg-[#0b1a14]', theater ? 'min-h-0 flex-1' : 'aspect-video')}>
        {inCall && video.remoteStream ? (
          <SpeakingFrame speaking={video.remoteSpeaking} className="absolute inset-0">
            <StreamVideo stream={video.remoteStream} className="h-full w-full object-cover" />
          </SpeakingFrame>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            {video.sfuUnavailable ? (
              <p className="text-[14px] text-white/80">
                Видео через сервер пока не подключено. Чат консультации доступен.
              </p>
            ) : video.phase === 'denied' ? (
              <p className="text-[14px] text-white/80">{video.error}</p>
            ) : video.phase === 'starting' ? (
              <p className="text-[14px] text-white/80">Подключаем камеру…</p>
            ) : video.phase === 'stopping' ? (
              <p className="text-[14px] text-white/80">Завершаем видео…</p>
            ) : inCall ? (
              <p className="text-[14px] text-white/80">Ожидаем собеседника…</p>
            ) : hubError ? (
              <p className="text-[14px] text-white/80">{hubError}</p>
            ) : !hubReady ? (
              <p className="text-[14px] text-white/70">Подключаемся к серверу звонка…</p>
            ) : (
              <p className="text-[14px] text-white/70">
                {video.incomingInvite ? 'Врач или пациент начал видеозвонок' : 'Видео ещё не начато'}
              </p>
            )}

            {canControl && video.phase === 'idle' && !video.sfuUnavailable && hubReady && (
              <Button
                disabled={busy}
                className={video.incomingInvite ? 'animate-pulse' : undefined}
                onClick={() => requestCall(video.incomingInvite ? 'join' : 'start')}
              >
                {video.incomingInvite ? 'Присоединиться' : 'Начать видео'}
              </Button>
            )}

            {canControl && video.phase === 'denied' && (
              <Button disabled={!hubReady} onClick={() => requestCall('start')}>
                Повторить
              </Button>
            )}
          </div>
        )}

        {inCall && video.localStream && (
          <SpeakingFrame
            speaking={video.localSpeaking && video.audioEnabled}
            className="absolute bottom-16 right-3 h-24 w-36 sm:bottom-16 sm:h-28 sm:w-40"
          >
            {video.videoEnabled ? (
              <StreamVideo
                stream={video.localStream}
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#1a1d1c] text-white/70">
                <IconCamOff className="h-7 w-7" />
              </div>
            )}
            {!video.audioEnabled && (
              <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#ed4245] text-white">
                <IconMicOff className="h-3.5 w-3.5" />
              </span>
            )}
          </SpeakingFrame>
        )}

        {controls}
      </div>

      {video.error && video.phase !== 'denied' && (
        <p className="px-4 py-2 text-[13px] text-danger">{video.error}</p>
      )}

      {consentOpen && (
        <VideoConsentModal
          onClose={() => {
            setConsentOpen(false);
            setPendingAction(null);
            setConsentError(null);
          }}
          onConfirm={(recording) => void confirmConsent(recording)}
        />
      )}
      {consentError && <p className="px-4 py-2 text-[13px] text-danger">{consentError}</p>}
    </Card>
  );
}
