'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

type UseQuerySearchOptions = {
  /** URL search param key to sync to (e.g. 'q'). */
  paramKey: string;
  /** Initial value, typically the server-rendered prop from the page. */
  initialValue?: string;
  /** Debounce delay in ms before the URL is updated. Defaults to 300. */
  delay?: number;
};

/**
 * Manages a debounced search input synced to a URL query param.
 *
 * `inputValue` updates immediately on every keystroke for responsive UI.
 * The URL (and thus the server re-render) is only updated after the user
 * stops typing for `delay` milliseconds. Changing the search value also
 * resets the `page` param so results always start from page 1.
 */
export function useQuerySearch({
  paramKey,
  initialValue = '',
  delay = 300,
}: UseQuerySearchOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentQueryValue = searchParams.get(paramKey) ?? '';
  const latestSearchParamsRef = useRef(searchParams.toString());

  const [draftValue, setDraftValue] = useState(() => searchParams.get(paramKey) ?? initialValue);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    latestSearchParamsRef.current = searchParams.toString();
  }, [searchParams]);

  useEffect(() => {
    if (!isTyping) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(latestSearchParamsRef.current);
      const latestQueryValue = params.get(paramKey) ?? '';

      if (draftValue === latestQueryValue) {
        setIsTyping(false);
        return;
      }

      if (draftValue === '') {
        params.delete(paramKey);
      } else {
        params.set(paramKey, draftValue);
      }

      // Reset to page 1 whenever the search term changes.
      params.delete('page');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });

      setIsTyping(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, draftValue, isTyping, paramKey, pathname, router, startTransition]);

  const onChange = useCallback((value: string) => {
    setDraftValue(value);
    setIsTyping(true);
  }, []);

  const inputValue = isTyping || isPending ? draftValue : currentQueryValue;

  return {
    inputValue,
    onChange,
    isSearching: isTyping || isPending,
  };
}
