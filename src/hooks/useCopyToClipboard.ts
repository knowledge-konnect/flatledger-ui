import { useState } from 'react';

/**
 * Copies text to clipboard
 * @returns [copiedText, copy function, error]
 */
export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const copy = async (text: string) => {
    if (!navigator?.clipboard) {
      setError(new Error('Clipboard not supported'));
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setError(null);
      return true;
    } catch (err) {
      setError(err as Error);
      setCopiedText(null);
      return false;
    }
  };

  return [copiedText, copy, error] as const;
}
