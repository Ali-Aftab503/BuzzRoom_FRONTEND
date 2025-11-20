/**
 * Resume Preview Component - MODERN UI
 * File: components/preview/ResumePreview.tsx
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { MinimalTemplate } from '@/components/templates/MinimalTemplate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Sparkles, Download } from 'lucide-react';
import { DownloadButton } from '@/components/shared/DownloadButton';

export function ResumePreview() {
  const { resumeData, setTemplate } = useResumeStore();

  const templates = [
    { 
      value: 'modern', 
      label: 'Modern', 
      description: 'Clean & professional',
      color: 'from-blue-500 to-purple-500'
    },
    { 
      value: 'classic', 
      label: 'Classic', 
      description: 'Traditional & formal',
      color: 'from-slate-600 to-slate-800'
    },
    { 
      value: 'minimal', 
      label: 'Minimal', 
      description: 'Simple & elegant',
      color: 'from-gray-400 to-gray-600'
    },
  ];

  const currentTemplate = templates.find(t => t.value === resumeData.template) || templates[0];

  return (
    <div className="flex flex-col h-full">
      {/* Template Switcher - Modern Design */}
      <Card className="p-4 bg-gradient-to-r from-white to-slate-50 shadow-md mb-4 flex-shrink-0 border-2 border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`bg-gradient-to-r ${currentTemplate.color} p-3 rounded-xl shadow-lg`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Template Style</h3>
              <p className="text-xs text-slate-600">Choose your resume design</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={resumeData.template}
              onValueChange={(value) => setTemplate(value as any)}
            >
              <SelectTrigger className="w-[180px] h-11 border-2 border-slate-300 font-medium">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${template.color}`} />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{template.label}</span>
                        <span className="text-xs text-slate-500">{template.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DownloadButton />
          </div>
        </div>
      </Card>

      {/* Live Preview Container */}
      <div className="flex-1 bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin bg-gradient-to-b from-slate-50 to-white">
          {/* Scale wrapper */}
          <div className="max-w-[850px] mx-auto bg-white shadow-xl my-6">
            {/* Render selected template */}
            {resumeData.template === 'modern' && <ModernTemplate data={resumeData} />}
            {resumeData.template === 'classic' && <ClassicTemplate data={resumeData} />}
            {resumeData.template === 'minimal' && <MinimalTemplate data={resumeData} />}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <Card className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-slate-700 font-medium">Live Preview</span>
          </div>
          <span className="text-slate-600">Updates automatically as you type</span>
        </div>
      </Card>
    </div>
  );
}