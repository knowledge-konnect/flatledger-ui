import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Command, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return context;
}

/**
 * Command Palette & Keyboard Shortcuts System
 * Cmd+K to open, searchable commands
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 200);

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  const registerShortcut = (shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev, shortcut]);
  };

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        return;
      }

      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        close();
        return;
      }

      // Execute shortcuts
      if (!isOpen) {
        shortcuts.forEach(shortcut => {
          const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
          const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
          const altMatch = shortcut.alt ? e.altKey : !e.altKey;
          
          if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
            e.preventDefault();
            shortcut.action();
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shortcuts]);

  const filteredShortcuts = debouncedQuery
    ? shortcuts.filter(s =>
        s.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        s.key.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : shortcuts;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredShortcuts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredShortcuts[selectedIndex]) {
      e.preventDefault();
      filteredShortcuts[selectedIndex].action();
      close();
    }
  };

  const getShortcutLabel = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrl) keys.push('⌘');
    if (shortcut.shift) keys.push('⇧');
    if (shortcut.alt) keys.push('⌥');
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' ');
  };

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, registerShortcut }}>
      {children}

      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          {/* Overlay with blur, below content */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in z-40"
            onClick={close}
          />
          {/* Modal content, always above overlay, no blur */}
          <div className="relative z-50 w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-in overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <Command className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                autoFocus
              />
              <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
                ESC
              </kbd>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredShortcuts.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm">No commands found</p>
                </div>
              ) : (
                filteredShortcuts.map((shortcut, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      shortcut.action();
                      close();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                      selectedIndex === index
                        ? 'bg-indigo-50 dark:bg-indigo-900/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="text-sm text-slate-900 dark:text-white">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
                      {getShortcutLabel(shortcut)}
                    </kbd>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}
