/**
 * Enhanced AI Suggest Button Component
 * With tone selection and improved UX
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AITone } from '@/lib/types';

interface AiSuggestButtonProps {
  prompt: string;
  context?: string;
  onComplete: (text: string) => void;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showToneSelector?: boolean;
  showImproveButton?: boolean;
  currentContent?: string;
}

const TONE_DESCRIPTIONS: Record<AITone, string> = {
  professional: 'Formal, business-appropriate language',
  creative: 'Engaging, unique, standout wording',
  technical: 'Precise, technical terminology',
  casual: 'Friendly, conversational tone',
};

export function AiSuggestButton({
  prompt,
  context,
  onComplete,
  buttonText = '✨ Generate',
  variant = 'secondary',
  size = 'sm',
  className = '',
  showToneSelector = true,
  showImproveButton = false,
  currentContent,
}: AiSuggestButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<AITone>('professional');
  const [showSuccess, setShowSuccess] = useState(false);

  const getTonePrompt = (baseTone: AITone): string => {
    const toneInstructions = {
      professional: 'Use professional, formal language. Be clear, concise, and business-appropriate.',
      creative: 'Use creative, engaging language. Make it unique and memorable while remaining professional.',
      technical: 'Use precise technical terminology. Be specific about technologies, methodologies, and technical achievements.',
      casual: 'Use friendly, conversational language. Be approachable while maintaining professionalism.',
    };
    
    return toneInstructions[baseTone];
  };

  const handleGenerate = async (isImprove: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    setShowSuccess(false);

    try {
      const toneInstruction = getTonePrompt(selectedTone);
      
      let fullPrompt = prompt;
      if (isImprove && currentContent) {
        fullPrompt = `Improve the following content while maintaining its core message. ${toneInstruction}\n\nCurrent content:\n${currentContent}\n\nProvide an improved version:`;
      } else {
        fullPrompt = `${prompt}\n\nTone: ${toneInstruction}`;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          result += chunk;
        }
      }

      const trimmedResult = result.trim();
      
      if (trimmedResult) {
        onComplete(trimmedResult);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        throw new Error('Empty response from AI');
      }
    } catch (err: any) {
      console.error('❌ AI Generation Error:', err);
      setError(err.message);
      
      // Better error messages
      let errorMessage = 'Failed to generate content. ';
      if (err.message.includes('API key')) {
        errorMessage += 'Please check your API key in .env.local file.';
      } else if (err.message.includes('rate limit')) {
        errorMessage += 'Rate limit reached. Please wait a moment and try again.';
      } else if (err.message.includes('network')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += err.message;
      }
      
      alert(`⚠️ ${errorMessage}\n\nTroubleshooting:\n1. Verify API key is set in .env.local\n2. Restart the dev server (npm run dev)\n3. Check browser console for details`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tone Selector */}
      {showToneSelector && (
        <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as AITone)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TONE_DESCRIPTIONS) as AITone[]).map((tone) => (
              <SelectItem key={tone} value={tone}>
                <div className="flex flex-col items-start">
                  <span className="font-medium capitalize">{tone}</span>
                  <span className="text-xs text-slate-500">{TONE_DESCRIPTIONS[tone]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Generate Button */}
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => handleGenerate(false)}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : showSuccess ? (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            Generated!
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Improve Button */}
      {showImproveButton && currentContent && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={() => handleGenerate(true)}
          disabled={isGenerating}
          title="Improve existing content"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}