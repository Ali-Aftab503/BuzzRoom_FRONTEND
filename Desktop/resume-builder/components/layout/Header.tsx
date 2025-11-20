/**
 * Application Header - With New Feature Buttons
 * File: components/layout/Header.tsx
 */

'use client';

import { Button } from '@/components/ui/button';
import { useResumeStore } from '@/store/resumeStore';
import { useToastHelpers } from '@/components/shared/Toast';
import { FileText, Trash2, Upload, Palette, Download, FileJson, Check, Save, List, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState, useRef } from 'react';
import { SectionReorder } from '@/components/shared/SectionReorder';
import { CoverLetterGenerator } from '@/components/shared/CoverLetterGenerator';
import { JobMatcher } from '@/components/shared/JobMatcher';
import { AnimatePresence } from 'framer-motion';

export function Header() {
  const { resetResume, loadExample, resumeData, setAccentColor, setResumeData } = useResumeStore();
  const toast = useToastHelpers();
  const [showSaved, setShowSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSectionReorder, setShowSectionReorder] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [showJobMatcher, setShowJobMatcher] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowSaved(true);
    setLastSaved(new Date());
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [resumeData]);

  const handleReset = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      resetResume();
      toast.success('Resume cleared successfully');
    }
  };

  const handleLoadExample = () => {
    loadExample();
    toast.success('Example resume loaded successfully!');
  };

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(resumeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${resumeData.personal.fullName || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Resume exported as JSON!');
    } catch (error) {
      toast.error('Failed to export resume');
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        if (!json.personal || !json.experience || !json.education || !json.skills) {
          throw new Error('Invalid resume format');
        }

        setResumeData(json);
        toast.success('Resume imported successfully!');
      } catch (error) {
        toast.error('Invalid resume file. Please check the format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Black', value: '#000000' },
  ];

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Branding */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 sm:p-2 rounded-lg shadow-md flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">AI Resume Builder</h1>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                  <p className="truncate">Create professional resumes with AI</p>
                  {showSaved && (
                    <span className="flex items-center gap-1 text-green-600 animate-fade-in whitespace-nowrap">
                      <Check className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                  {!showSaved && lastSaved && (
                    <span className="flex items-center gap-1 text-slate-500 whitespace-nowrap">
                      <Save className="w-3 h-3" />
                      {formatTimeAgo(lastSaved)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
              {/* NEW FEATURE BUTTONS */}
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCoverLetter(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-8 hidden md:flex"
              >
                <FileText className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Cover Letter</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowJobMatcher(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-8 hidden md:flex"
              >
                <Target className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Job Match</span>
              </Button>

              {/* Section Reorder */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSectionReorder(true)}
                className="hidden xl:flex h-8"
              >
                <List className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Reorder</span>
              </Button>

              {/* Color Picker */}
              <div className="hidden xl:flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                <Select
                  value={resumeData.accentColor || '#3b82f6'}
                  onValueChange={(value) => {
                    setAccentColor(value);
                    toast.info('Color updated');
                  }}
                >
                  <SelectTrigger className="w-[110px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accentColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-xs">{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Import/Export */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8"
                >
                  <Upload className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  className="h-8"
                >
                  <FileJson className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>

              {/* Load Example */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadExample}
                className="h-8 hidden sm:flex"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Example
              </Button>

              {/* Clear All */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8"
              >
                <Trash2 className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AnimatePresence>
        {showSectionReorder && (
          <SectionReorder onClose={() => setShowSectionReorder(false)} />
        )}
        {showCoverLetter && (
          <CoverLetterGenerator onClose={() => setShowCoverLetter(false)} />
        )}
        {showJobMatcher && (
          <JobMatcher onClose={() => setShowJobMatcher(false)} />
        )}
      </AnimatePresence>
    </>
  );
}