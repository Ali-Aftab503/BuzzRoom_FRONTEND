/**
 * Professional Summary Form Component - Enhanced
 * With character counter and improved AI
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Label } from '@/components/ui/label';
import { AiSuggestButton } from '@/components/shared/AiSuggestButton';
import TextareaAutosize from 'react-textarea-autosize';

export function SummaryForm() {
  const { resumeData, updateSummary } = useResumeStore();
  const characterCount = resumeData.summary.length;
  const idealLength = 500; // Ideal summary length
  const maxLength = 800;

  // Build context from resume data for better AI suggestions
  const buildContext = () => {
    const { personal, experience, education, skills } = resumeData;
    
    let context = `Person: ${personal.fullName || 'Professional'}`;
    
    if (experience.length > 0) {
      const currentJob = experience[0];
      context += `\nCurrent Role: ${currentJob.jobTitle} at ${currentJob.company}`;
      context += `\nYears of Experience: ${experience.length} positions`;
    }
    
    if (education.length > 0) {
      context += `\nEducation: ${education[0].degree}`;
    }
    
    if (skills.length > 0) {
      const topSkills = skills.slice(0, 5).map(s => s.name).join(', ');
      context += `\nTop Skills: ${topSkills}`;
    }
    
    return context;
  };

  const generatePrompt = () => {
    return `Write a compelling professional summary for a resume. Make it 2-4 sentences (300-500 characters), highlighting key experience and achievements. Be specific and impactful. Focus on value proposition and career highlights.`;
  };

  const getCharacterCountColor = () => {
    if (characterCount === 0) return 'text-slate-400';
    if (characterCount < 200) return 'text-orange-600';
    if (characterCount <= idealLength) return 'text-green-600';
    if (characterCount <= maxLength) return 'text-blue-600';
    return 'text-red-600';
  };

  const getCharacterCountLabel = () => {
    if (characterCount === 0) return 'Start writing...';
    if (characterCount < 200) return 'Too short';
    if (characterCount <= idealLength) return 'Perfect!';
    if (characterCount <= maxLength) return 'Good length';
    return 'Too long';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="summary">
            Professional Summary
            <span className="text-xs text-slate-500 font-normal ml-2">
              (2-4 sentences recommended)
            </span>
          </Label>
          <AiSuggestButton
            prompt={generatePrompt()}
            context={buildContext()}
            onComplete={(text) => updateSummary(text)}
            buttonText="Generate"
            size="sm"
            showToneSelector={true}
            showImproveButton={true}
            currentContent={resumeData.summary}
          />
        </div>
        
        <TextareaAutosize
          id="summary"
          value={resumeData.summary}
          onChange={(e) => updateSummary(e.target.value)}
          placeholder="Results-driven professional with X years of experience in [your field]. Proven track record of [key achievements]. Passionate about [relevant interests] and committed to [professional values]."
          minRows={4}
          maxLength={maxLength}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
        
        {/* Character Counter */}
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${getCharacterCountColor()}`}>
            {characterCount} / {maxLength} characters • {getCharacterCountLabel()}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className={`h-2 w-12 rounded ${characterCount >= 200 ? 'bg-green-500' : 'bg-slate-200'}`} />
              <div className={`h-2 w-12 rounded ${characterCount >= 350 ? 'bg-green-500' : 'bg-slate-200'}`} />
              <div className={`h-2 w-12 rounded ${characterCount >= 500 ? 'bg-blue-500' : 'bg-slate-200'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Helper Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
        <p className="font-medium mb-1">✍️ Writing Tips:</p>
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li>Start with your current role or professional identity</li>
          <li>Highlight your most impressive quantifiable achievements</li>
          <li>Mention years of experience and key specializations</li>
          <li>End with your value proposition or career goal</li>
          <li>Keep it between 300-500 characters for best impact</li>
        </ul>
      </div>

      {/* Example Summaries */}
      <details className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <summary className="text-sm font-medium text-blue-900 cursor-pointer">
          📝 View Example Summaries
        </summary>
        <div className="mt-3 space-y-3 text-xs">
          <div className="bg-white p-2 rounded border">
            <p className="font-medium text-slate-700 mb-1">Software Engineer:</p>
            <p className="text-slate-600 italic">
              "Full-stack developer with 5+ years building scalable web applications. Specialized in React, Node.js, and cloud architecture. Led projects that increased user engagement by 40% and reduced infrastructure costs by $500K. Passionate about clean code and mentoring junior developers."
            </p>
          </div>
          <div className="bg-white p-2 rounded border">
            <p className="font-medium text-slate-700 mb-1">Marketing Manager:</p>
            <p className="text-slate-600 italic">
              "Digital marketing strategist with 8 years driving growth for B2B SaaS companies. Expert in SEO, content marketing, and marketing automation. Grew MQL pipeline by 200% and reduced CAC by 35% through data-driven campaigns. Proven leader managing cross-functional teams of 10+."
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}