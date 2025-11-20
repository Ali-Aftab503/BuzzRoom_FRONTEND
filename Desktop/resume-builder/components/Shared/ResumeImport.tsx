/**
 * Resume Import Component - Improved
 * Import from PDF, DOCX, LinkedIn, or plain text with better parsing
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useResumeStore } from '@/store/resumeStore';
import { useToastHelpers } from '@/components/shared/Toast';
import { Upload, FileText, Linkedin, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportedData {
  personal?: any;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: any[];
  projects?: any[];
  certifications?: any[];
}

export function ResumeImport({ onClose }: { onClose: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'linkedin' | 'text' | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setResumeData, resumeData } = useResumeStore();
  const toast = useToastHelpers();

  // Parse resume text using AI with enhanced prompt
  const parseResumeWithAI = async (text: string): Promise<ImportedData> => {
    setProgress('Analyzing resume structure...');
    
    const prompt = `You are a resume parsing expert. Extract structured data from the following resume text and return ONLY a valid JSON object (no markdown, no backticks, no explanations).

IMPORTANT INSTRUCTIONS:
1. Parse ALL information accurately
2. Extract dates in YYYY-MM format
3. For current positions, set isPresent: true and endDate: "Present"
4. Group skills by category (Programming, Tools, etc.)
5. Extract bullet points for experience descriptions
6. Include all contact information found

Required JSON structure:
{
  "personal": {
    "firstName": "string",
    "lastName": "string", 
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string (optional)",
    "linkedin": "string (optional)",
    "github": "string (optional)"
  },
  "summary": "string (professional summary/objective)",
  "experience": [
    {
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "isPresent": boolean,
      "description": "string with bullet points (use • for bullets)"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "gpa": "string (optional)",
      "honors": "string (optional)",
      "description": "string (optional)"
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "string (Programming/Frontend/Backend/Tools/etc)",
      "level": "Beginner|Intermediate|Advanced|Expert (optional)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array", "of", "strings"],
      "link": "string (optional)"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM",
      "credentialId": "string (optional)",
      "link": "string (optional)"
    }
  ]
}

Resume text to parse:
${text}

Remember: Return ONLY the JSON object, nothing else.`;

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context: 'Parse resume data accurately' }),
    });

    if (!response.ok) throw new Error('Failed to parse resume');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
        setProgress('Processing content...');
      }
    }

    // Clean up response - remove markdown formatting
    let cleanedResult = result.trim();
    cleanedResult = cleanedResult.replace(/```json\s*/g, '');
    cleanedResult = cleanedResult.replace(/```\s*/g, '');
    cleanedResult = cleanedResult.trim();

    // Find JSON object in response
    const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResult = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(cleanedResult);
      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Cleaned Result:', cleanedResult);
      throw new Error('Failed to parse AI response as JSON');
    }
  };

  // Extract text from PDF (simplified - in production use pdf-parse)
  const extractTextFromPDF = async (file: File): Promise<string> => {
    setProgress('Extracting text from PDF...');
    
    // Note: This is simplified. In production, use:
    // npm install pdf-parse
    // or use a PDF.js based solution
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // Simplified extraction - just get text content
          const text = new TextDecoder().decode(arrayBuffer);
          // Clean up binary data
          const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
          resolve(cleanText);
        } catch (error) {
          reject(new Error('Failed to extract PDF text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Extract text from DOCX (simplified - in production use mammoth)
  const extractTextFromDOCX = async (file: File): Promise<string> => {
    setProgress('Extracting text from DOCX...');
    
    // Note: This is simplified. In production, use:
    // npm install mammoth
    // const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({arrayBuffer});
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // Simplified extraction
          const text = new TextDecoder().decode(arrayBuffer);
          const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
          resolve(cleanText);
        } catch (error) {
          reject(new Error('Failed to extract DOCX text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read DOCX file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file upload (PDF, DOCX, TXT)
  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    setProgress('Reading file...');
    
    try {
      let text = '';

      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
        
        // Fallback message if extraction seems poor
        if (text.length < 100) {
          toast.warning('PDF text extraction may be incomplete. Consider using text paste instead.');
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        text = await extractTextFromDOCX(file);
        
        if (text.length < 100) {
          toast.warning('DOCX text extraction may be incomplete. Consider using text paste instead.');
        }
      } else if (file.type === 'text/plain') {
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
        });
      } else {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract enough text from file. Try pasting the text directly.');
      }

      await processResumeText(text);
    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(error.message || 'Failed to process file');
      setIsImporting(false);
      setProgress('');
    }
  };

  // Process resume text with AI
  const processResumeText = async (text: string) => {
    try {
      setProgress('Parsing with AI...');
      const parsed = await parseResumeWithAI(text);
      
      setProgress('Organizing data...');
      
      // Generate IDs for all items
      const dataWithIds = {
        ...resumeData,
        personal: {
          ...resumeData.personal,
          ...parsed.personal,
          fullName: parsed.personal?.fullName || `${parsed.personal?.firstName || ''} ${parsed.personal?.lastName || ''}`.trim(),
        },
        summary: parsed.summary || resumeData.summary,
        experience: (parsed.experience || []).map((exp, idx) => ({
          ...exp,
          id: `exp-imported-${Date.now()}-${idx}`,
        })),
        education: (parsed.education || []).map((edu, idx) => ({
          ...edu,
          id: `edu-imported-${Date.now()}-${idx}`,
        })),
        skills: (parsed.skills || []).map((skill, idx) => ({
          ...skill,
          id: `skill-imported-${Date.now()}-${idx}`,
        })),
        projects: (parsed.projects || []).map((proj, idx) => ({
          ...proj,
          id: `proj-imported-${Date.now()}-${idx}`,
        })),
        certifications: (parsed.certifications || []).map((cert, idx) => ({
          ...cert,
          id: `cert-imported-${Date.now()}-${idx}`,
        })),
        lastModified: new Date().toISOString(),
      };

      setProgress('Import complete!');
      setResumeData(dataWithIds);
      
      // Show success summary
      const summary = `
        ✅ Imported successfully!
        • ${parsed.experience?.length || 0} jobs
        • ${parsed.education?.length || 0} degrees
        • ${parsed.skills?.length || 0} skills
        • ${parsed.projects?.length || 0} projects
        • ${parsed.certifications?.length || 0} certifications
      `;
      
      toast.success('Resume imported successfully! Review and edit as needed.');
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      console.error('Parse error:', error);
      toast.error(error.message || 'Failed to parse resume. Please try manual entry or text paste.');
    } finally {
      setIsImporting(false);
      setProgress('');
    }
  };

  // Handle LinkedIn URL
  const handleLinkedInImport = async () => {
    toast.info('LinkedIn direct import requires API access. Please copy your profile text and use "Paste Text" instead.');
    setImportMethod('text');
  };

  // Handle text paste
  const handleTextImport = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume text');
      return;
    }

    await processResumeText(resumeText);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Import Resume</h2>
              <p className="text-sm text-slate-600 mt-1">
                Import from file, LinkedIn, or paste text
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isImporting}
              className="text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="px-6 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">{progress}</p>
                    <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-4">
            {!importMethod ? (
              /* Import Method Selection */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* File Upload */}
                <button
                  onClick={() => {
                    setImportMethod('file');
                    fileInputRef.current?.click();
                  }}
                  disabled={isImporting}
                  className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400 group-hover:text-blue-600" />
                  <h3 className="font-semibold text-slate-900 mb-1">Upload File</h3>
                  <p className="text-xs text-slate-600">PDF, DOCX, or TXT</p>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => setImportMethod('linkedin')}
                  disabled={isImporting}
                  className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Linkedin className="w-12 h-12 mx-auto mb-3 text-slate-400 group-hover:text-blue-600" />
                  <h3 className="font-semibold text-slate-900 mb-1">LinkedIn</h3>
                  <p className="text-xs text-slate-600">From profile text</p>
                </button>

                {/* Text Paste */}
                <button
                  onClick={() => setImportMethod('text')}
                  disabled={isImporting}
                  className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400 group-hover:text-blue-600" />
                  <h3 className="font-semibold text-slate-900 mb-1">Paste Text</h3>
                  <p className="text-xs text-slate-600">Copy & paste resume</p>
                </button>
              </div>
            ) : (
              /* Import Interface */
              <AnimatePresence mode="wait">
                <motion.div
                  key={importMethod}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {importMethod === 'linkedin' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-900">
                            <p className="font-medium mb-1">Alternative Method Required</p>
                            <p className="text-xs">
                              LinkedIn doesn't allow automated data extraction. Please copy your profile sections 
                              (About, Experience, Education, Skills) and use the "Paste Text" option instead.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setImportMethod('text')}
                        className="w-full"
                      >
                        Switch to Text Paste
                      </Button>
                    </div>
                  )}

                  {importMethod === 'text' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Paste Your Resume Text
                        </label>
                        <textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste your complete resume text here (including name, contact info, experience, education, skills)..."
                          rows={14}
                          disabled={isImporting}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          {resumeText.length} characters • AI will automatically parse and organize your resume
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">💡 Best Results Tips</p>
                            <ul className="text-xs space-y-1 list-disc list-inside">
                              <li>Include all sections: summary, experience, education, skills</li>
                              <li>Keep original formatting and bullet points</li>
                              <li>Include dates in a consistent format</li>
                              <li>Don't worry about perfect formatting - AI will clean it up!</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setImportMethod(null);
                            setResumeText('');
                          }}
                          variant="outline"
                          className="flex-1"
                          disabled={isImporting}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleTextImport}
                          disabled={isImporting || !resumeText.trim() || resumeText.length < 50}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Import Resume
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />

            {/* Info Section */}
            {!importMethod && !isImporting && (
              <div className="bg-slate-50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  How It Works
                </h4>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">1.</span>
                    <span>Upload your file or paste resume text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">2.</span>
                    <span>AI analyzes and extracts all information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">3.</span>
                    <span>Data is organized into proper sections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">4.</span>
                    <span>Review and edit as needed - nothing is permanent!</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}