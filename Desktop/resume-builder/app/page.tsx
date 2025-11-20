/**
 * Main Application Page - SIMPLIFIED & FIXED
 * File: app/page.tsx
 */

'use client';

import { ResumeEditor } from '@/components/editor/ResumeEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { Header } from '@/components/layout/Header';
import { KeyboardShortcuts } from '@/components/shared/KeyboardShortcuts';
import { CoverLetterGenerator } from '@/components/shared/CoverLetterGenerator';
import { JobMatcher } from '@/components/shared/JobMatcher';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';

export default function Home() {
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [showJobMatcher, setShowJobMatcher] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <Header />

      {/* Mobile View Toggle */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 sticky top-[73px] z-40">
        <div className="flex gap-2">
          <Button
            variant={mobileView === 'editor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMobileView('editor')}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editor
          </Button>
          <Button
            variant={mobileView === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMobileView('preview')}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
        <div className="w-full max-w-[1920px] mx-auto flex">
          
          {/* Left Side: Editor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`${
              mobileView === 'preview' ? 'hidden lg:block' : 'block'
            } w-full lg:w-1/2 h-full overflow-y-auto scrollbar-thin bg-white lg:border-r border-slate-200`}
          >
            <div className="p-4 sm:p-6">
              <ResumeEditor />
            </div>
          </motion.div>

          {/* Right Side: Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className={`${
              mobileView === 'editor' ? 'hidden lg:block' : 'block'
            } w-full lg:w-1/2 h-full bg-slate-50 p-4 sm:p-6 overflow-y-auto`}
          >
            <ResumePreview />
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCoverLetter && (
          <CoverLetterGenerator onClose={() => setShowCoverLetter(false)} />
        )}
        {showJobMatcher && (
          <JobMatcher onClose={() => setShowJobMatcher(false)} />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </div>
  );
}