/**
 * Job Matcher - FIXED UI VERSION
 * File: components/shared/JobMatcher.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useResumeStore } from '@/store/resumeStore';
import { useToastHelpers } from '@/components/shared/Toast';
import { 
  X, Target, Loader2, TrendingUp, AlertTriangle, 
  CheckCircle, Lightbulb, ArrowRight, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';

interface JobMatcherProps {
  onClose: () => void;
}

interface MatchResult {
  overallScore: number;
  keywordMatches: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  skillsMatch: number;
  experienceMatch: number;
}

export function JobMatcher({ onClose }: JobMatcherProps) {
  const { resumeData } = useResumeStore();
  const toast = useToastHelpers();
  
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMatch = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const resumeText = `
${resumeData.personal.fullName}
${resumeData.summary}

Experience:
${resumeData.experience.map(exp => `${exp.jobTitle} at ${exp.company}\n${exp.description}`).join('\n\n')}

Education:
${resumeData.education.map(edu => `${edu.degree} - ${edu.institution}`).join('\n')}

Skills: ${resumeData.skills.map(s => s.name).join(', ')}
`;

      const prompt = `Analyze resume vs job description match. Return ONLY valid JSON (no markdown):

{
  "overallScore": <0-100>,
  "keywordMatches": [<keywords found in resume>],
  "missingKeywords": [<important keywords NOT in resume>],
  "suggestions": [<5-7 specific suggestions>],
  "strengths": [<3-5 strong matching points>],
  "skillsMatch": <0-100>,
  "experienceMatch": <0-100>
}

Job Description:
${jobDescription}

Resume:
${resumeText}`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: 'Job match analysis' }),
      });

      if (!response.ok) throw new Error('Failed to analyze');

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

      let cleanedResult = result.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanedResult = jsonMatch[0];

      const parsed: MatchResult = JSON.parse(cleanedResult);
      setMatchResult(parsed);
      
      if (parsed.overallScore >= 80) {
        toast.success(`Excellent! ${parsed.overallScore}% match`);
      } else if (parsed.overallScore >= 60) {
        toast.info(`Good! ${parsed.overallScore}% match`);
      } else {
        toast.warning(`${parsed.overallScore}% match. Check suggestions.`);
      }
    } catch (error: any) {
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Job Description Matcher</h2>
              <p className="text-purple-100 text-sm">See how well your resume fits the job</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!matchResult ? (
            /* Input Form */
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-slate-900">Paste Job Description</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Copy the full job description and paste it below for instant analysis
                </p>
                
                <TextareaAutosize
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                  disabled={isAnalyzing}
                  minRows={12}
                  maxRows={20}
                  className="w-full px-4 py-4 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 resize-none text-sm"
                />
                
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-600">
                    {jobDescription.length} characters
                    {jobDescription.length > 0 && jobDescription.length < 100 && (
                      <span className="text-orange-600 ml-2">• Too short</span>
                    )}
                  </p>
                  <Button
                    onClick={analyzeMatch}
                    disabled={isAnalyzing || jobDescription.length < 100}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12 px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Analyze Match
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 mb-1 text-sm">Keyword Analysis</h4>
                  <p className="text-xs text-slate-600">Find missing keywords</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <Target className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 mb-1 text-sm">Match Score</h4>
                  <p className="text-xs text-slate-600">Overall compatibility</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <Lightbulb className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 mb-1 text-sm">Suggestions</h4>
                  <p className="text-xs text-slate-600">How to improve</p>
                </div>
              </div>
            </div>
          ) : (
            /* Results */
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-600 mb-2">Overall Match Score</h3>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-6xl font-bold ${getScoreColor(matchResult.overallScore)}`}>
                        {matchResult.overallScore}
                      </span>
                      <span className="text-2xl text-slate-400">/100</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(matchResult.skillsMatch)}`}>
                        {matchResult.skillsMatch}%
                      </div>
                      <div className="text-xs text-slate-600 mt-1">Skills Match</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(matchResult.experienceMatch)}`}>
                        {matchResult.experienceMatch}%
                      </div>
                      <div className="text-xs text-slate-600 mt-1">Experience Match</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${matchResult.overallScore}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full ${getScoreBg(matchResult.overallScore)} rounded-full`}
                    />
                  </div>
                </div>
              </Card>

              {/* Strengths & Suggestions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-green-50 border-2 border-green-200 p-6">
                  <h3 className="text-lg font-bold text-green-900 flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    Your Strengths
                  </h3>
                  <ul className="space-y-2">
                    {matchResult.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="bg-blue-50 border-2 border-blue-200 p-6">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5" />
                    Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {matchResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                        <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Keywords */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-purple-50 border-2 border-purple-200 p-6">
                  <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    Matched Keywords ({matchResult.keywordMatches.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.keywordMatches.slice(0, 15).map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {keyword}
                      </span>
                    ))}
                    {matchResult.keywordMatches.length > 15 && (
                      <span className="text-xs text-purple-700 self-center">
                        +{matchResult.keywordMatches.length - 15} more
                      </span>
                    )}
                  </div>
                </Card>

                <Card className="bg-amber-50 border-2 border-amber-200 p-6">
                  <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    Missing Keywords ({matchResult.missingKeywords.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missingKeywords.slice(0, 15).map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        {keyword}
                      </span>
                    ))}
                    {matchResult.missingKeywords.length > 15 && (
                      <span className="text-xs text-amber-700 self-center">
                        +{matchResult.missingKeywords.length - 15} more
                      </span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => setMatchResult(null)}
                  variant="outline"
                  className="px-8"
                >
                  Analyze Another Job
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}