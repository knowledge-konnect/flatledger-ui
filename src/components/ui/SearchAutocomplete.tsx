import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';
import { useClickOutside } from '../../hooks/useClickOutside';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  results: SearchResult[];
  isLoading?: boolean;
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  className?: string;
  showRecentSearches?: boolean;
}

/**
 * Advanced Search Component with Autocomplete
 * Features: Debouncing, keyboard navigation, recent searches
 */
export function SearchAutocomplete({
  placeholder = 'Search...',
  results,
  isLoading,
  onSearch,
  onSelect,
  className,
  showRecentSearches = true,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useClickOutside(containerRef, () => setIsOpen(false));

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
  }, [showRecentSearches]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setQuery('');
    setIsOpen(false);
    
    // Save to recent searches
    if (showRecentSearches) {
      const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    const itemCount = query ? results.length : recentSearches.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (query) {
            handleSelect(results[selectedIndex]);
          } else {
            setQuery(recentSearches[selectedIndex]);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-lg',
            'bg-white dark:bg-slate-900',
            'border-2 border-slate-200 dark:border-slate-700',
            'text-slate-900 dark:text-white',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
            'transition-all duration-200'
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto animate-scale-in">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-sm">Searching...</p>
            </div>
          ) : query ? (
            // Search Results
            results.length > 0 ? (
              results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors',
                    selectedIndex === index
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  {result.icon && <div className="flex-shrink-0">{result.icon}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {highlightMatch(result.title, query)}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )
          ) : showRecentSearches && recentSearches.length > 0 ? (
            // Recent Searches
            <>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className={cn(
                    'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors',
                    selectedIndex === index
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{search}</span>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm">Start typing to search...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
