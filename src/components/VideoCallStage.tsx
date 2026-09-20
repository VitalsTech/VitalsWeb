import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { ConsultationVideo } from '@/lib/useConsultationVideo';
import { VideoCallPanel } from './VideoCallPanel';

export function VideoCallStage({
  video,
  sessionId,
  requireConsent,
  hubReady,
  hubError,
  disabled,
  before,
  chat,
  extra,
}: {
  video: ConsultationVideo;
  sessionId: string | null | undefined;
  requireConsent: boolean;
  hubReady: boolean;
  hubError?: string | null;
  disabled?: boolean;
  before?: ReactNode;
  chat: ReactNode;
  extra?: ReactNode;
}) {
  const [theater, setTheater] = useState(false);

  useEffect(() => {
    if (video.phase !== 'incall' && theater) setTheater(false);
  }, [theater, video.phase]);

  useEffect(() => {
    if (!theater) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTheater(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [theater]);

  const panel = (
    <VideoCallPanel
      video={video}
      sessionId={sessionId}
      requireConsent={requireConsent}
      hubReady={hubReady}
      hubError={hubError}
      disabled={disabled}
      theater={theater}
      onTheaterChange={setTheater}
      className={theater ? 'h-full' : undefined}
    />
  );

  const columns = before && extra ? 'xl:grid-cols-[280px_minmax(0,1fr)_320px]' : before ? 'lg:grid-cols-[300px_1fr]' : '';

  return (
    <div
      className={cn(
        theater
          ? 'fixed inset-0 z-[80] flex gap-3 bg-[#0b1a14] p-3'
          : cn('grid grid-cols-1 gap-6', columns),
      )}
    >
      {!theater && before}
      <div className={cn('flex min-w-0 flex-col gap-6', theater && 'min-h-0 flex-1')}>
        {panel}
        {!theater && chat}
      </div>
      {(extra || theater) && (
        <aside
          className={cn(
            'flex min-h-0 min-w-0 flex-col gap-3',
            theater && 'w-[min(420px,42vw)] overflow-hidden rounded-lg bg-bg p-3',
            theater ? '[&_.js-chat-log]:max-h-none [&_.js-chat-log]:flex-1' : undefined,
          )}
        >
          {theater && <div className="flex min-h-0 flex-1 flex-col gap-3">{chat}</div>}
          {extra && (
            <div className={cn(theater && 'min-h-0 max-h-[46%] overflow-y-auto scrollbar-thin')}>{extra}</div>
          )}
        </aside>
      )}
    </div>
  );
}
