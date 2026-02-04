import { useEffect, useRef, ReactNode } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loader?: ReactNode;
  threshold?: number;
}

/**
 * Infinite Scroll Component
 * Automatically loads more data when scrolling near bottom
 */
export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  loader,
  threshold = 0.8,
}: InfiniteScrollProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold,
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return (
    <div>
      {children}
      
      {hasMore && (
        <div ref={loadMoreRef} className="py-4">
          {isLoading && (
            loader || (
              <div className="space-y-3">
                <LoadingSkeleton variant="card" />
                <LoadingSkeleton variant="card" />
              </div>
            )
          )}
        </div>
      )}
      
      {!hasMore && (
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>No more items to load</p>
        </div>
      )}
    </div>
  );
}
