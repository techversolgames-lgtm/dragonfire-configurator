import { useEffect, useState } from 'react';

export default function useIsIframe(): boolean {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true); // fallback for cross-origin access errors
    }
  }, []);

  return isIframe;
}
