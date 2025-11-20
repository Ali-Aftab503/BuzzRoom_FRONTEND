/**
 * Keyboard Shortcuts Component
 * Global keyboard shortcuts for power users
 */

'use client';

import { useEffect, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Button } from '@/components/ui/button';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

export function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const { loadExample, resetResume, addWorkExperience, addEducation, addSkill } = useResumeStore();

  const shortcuts: Shortcut[] = [
    {
      key: 'Ctrl+E',
      description: 'Load example resume',
      action: loadExample,
    },
    {
      key: 'Ctrl+Shift+R',
      description: 'Reset all data',
      action: () => {
        if (confirm('Are you sure you want to clear all data?')) {
          resetResume();
        }
      },
    },
    {
      key: 'Ctrl+Shift+J',
      description: 'Add new job',
      action: addWorkExperience,
    },
    {
      key: 'Ctrl+Shift+E',
      description: 'Add new education',
      action: addEducation,
    },
    {
      key: 'Ctrl+Shift+S',
      description: 'Add new skill',
      action: addSkill,
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(true),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with just "?" (no modifiers)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Handle Ctrl/Cmd shortcuts
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      // Prevent default for our shortcuts
      const shortcutKey = e.shiftKey ? `Ctrl+Shift+${e.key.toUpperCase()}` : `Ctrl+${e.key.toUpperCase()}`;
      const shortcut = shortcuts.find(s => s.key === shortcutKey);

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all z-40"
        title="Keyboard shortcuts (Press ?)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <span className="text-sm text-slate-600">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 border border-slate-300 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-slate-500">
          <p>💡 Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded">?</kbd> anytime to show this dialog</p>
        </div>

        <Button
          onClick={() => setShowHelp(false)}
          className="w-full mt-4"
          variant="outline"
        >
          Close
        </Button>
      </div>
    </div>
  );
}