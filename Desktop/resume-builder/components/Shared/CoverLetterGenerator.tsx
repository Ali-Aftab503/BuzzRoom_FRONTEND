/**
 * Cover Letter Generator - FIXED UI VERSION
 * File: components/shared/CoverLetterGenerator.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResumeStore } from '@/store/resumeStore';
import { useToastHelpers } from '@/components/shared/Toast';
import { X, FileText, Loader2, Download, Copy, CheckCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';

interface CoverLetterGeneratorProps {
  onClose: () => void;
}

export function CoverLetterGenerator({ onClose }: CoverLetterGeneratorProps) {
  const { resumeData } = useResumeStore();
  const toast = useToastHelpers();
  
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCoverLetter = async () => {
    if (!companyName || !position) {
      toast.error('Please enter company name and position');
      return;
    }

    setIsGenerating(true);
    
    try {
      const resumeContext = `
Name: ${resumeData.personal.fullName}
Email: ${resumeData.personal.email}
Phone: ${resumeData.personal.phone}

Professional Summary:
${resumeData.summary}

Recent Experience:
${resumeData.experience.slice(0, 2).map(exp => `
- ${exp.jobTitle} at ${exp.company}
${exp.description}
`).join('\n')}

Skills: ${resumeData.skills.map(s => s.name).join(', ')}
`;

      const prompt = `Write a professional cover letter for this job application:

Position: ${position}
Company: ${companyName}
${hiringManager ? `Hiring Manager: ${hiringManager}` : ''}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Candidate Information:
${resumeContext}

Requirements:
- Professional business letter format
- Address hiring manager by name if provided
- 3-4 paragraphs highlighting relevant experience
- Specific examples of achievements
- Strong closing with call to action
- Length: 300-400 words

Make it personalized and impactful.`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: 'Cover letter generation' }),
      });

      if (!response.ok) throw new Error('Failed to generate cover letter');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value);
        }
      }

      setCoverLetter(result.trim());
      toast.success('Cover letter generated!');
    } catch (error: any) {
      toast.error('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cover-Letter-${companyName.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Cover Letter Generator</h2>
              <p className="text-blue-100 text-sm">Create personalized cover letters instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Fixed Layout */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT SIDE - Input Form */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Job Details</h3>
                
                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Company Name *
                    </Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., Google"
                      disabled={isGenerating}
                      className="w-full"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Position *
                    </Label>
                    <Input
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      disabled={isGenerating}
                      className="w-full"
                    />
                  </div>

                  {/* Hiring Manager */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Hiring Manager (Optional)
                    </Label>
                    <Input
                      value={hiringManager}
                      onChange={(e) => setHiringManager(e.target.value)}
                      placeholder="e.g., John Smith"
                      disabled={isGenerating}
                      className="w-full"
                    />
                  </div>

                  {/* Job Description */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Job Description (Optional)
                    </Label>
                    <TextareaAutosize
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      disabled={isGenerating}
                      minRows={4}
                      maxRows={8}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {jobDescription.length} characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-medium mb-1">AI-Powered Personalization</p>
                    <ul className="text-xs space-y-1">
                      <li>• Matches your resume experience</li>
                      <li>• Tailored to job description</li>
                      <li>• Professional business format</li>
                      <li>• Ready to copy and send</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateCoverLetter}
                disabled={isGenerating || !companyName || !position}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>

            {/* RIGHT SIDE - Generated Cover Letter */}
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden flex flex-col" style={{ height: '600px' }}>
              {/* Preview Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-semibold text-slate-900">
                  Your Cover Letter
                </h3>
                {coverLetter && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {coverLetter ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
                      {coverLetter}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                    <FileText className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-sm">
                      Fill in the job details and click<br />
                      Generate to create your cover letter
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}