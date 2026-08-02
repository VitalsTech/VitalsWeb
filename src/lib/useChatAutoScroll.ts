import { useEffect, useRef } from 'react';

/**
 * Scrolls the chat transcript to the bottom when messages (or a "busy" flag) change.
 * Put the returned ref on a sentinel element after the message list, inside the scroll container.
 */
export function useChatAutoScroll(deps: unknown[]) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes the chat dependency list
  }, deps);

  return endRef;
}
