/**
 * Education Form Component - Enhanced
 * With duplicate button for consistency
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, GraduationCap, Copy } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

export function EducationForm() {
  const { resumeData, updateEducation, addEducation, removeEducation, duplicateEducation } = useResumeStore();
  const { education } = resumeData;

  return (
    <div className="space-y-4">
      {education.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No education added yet</p>
          <p className="text-xs mt-1">Click the button below to add your education</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={[education[0]?.id]} className="space-y-3">
          {education.map((edu, index) => (
            <AccordionItem
              key={edu.id}
              value={edu.id}
              className="border rounded-md px-3 bg-white"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2 text-left">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">
                      {edu.degree || `Education ${index + 1}`}
                      {edu.institution && ` at ${edu.institution}`}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-3">
                <div className="space-y-4">
                  {/* Degree */}
                  <div className="space-y-2">
                    <Label htmlFor={`degree-${edu.id}`}>Degree *</Label>
                    <Input
                      id={`degree-${edu.id}`}
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      placeholder="Bachelor of Science in Computer Science"
                    />
                  </div>

                  {/* Institution and Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`institution-${edu.id}`}>Institution *</Label>
                      <Input
                        id={`institution-${edu.id}`}
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                        placeholder="University of California"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-location-${edu.id}`}>Location *</Label>
                      <Input
                        id={`edu-location-${edu.id}`}
                        value={edu.location}
                        onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                        placeholder="Berkeley, CA"
                      />
                    </div>
                  </div>

                  {/* Start Date and End Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edu-start-date-${edu.id}`}>Start Date *</Label>
                      <Input
                        id={`edu-start-date-${edu.id}`}
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-end-date-${edu.id}`}>End Date *</Label>
                      <Input
                        id={`edu-end-date-${edu.id}`}
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* GPA and Honors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`gpa-${edu.id}`} className="text-slate-600">
                        GPA (Optional)
                      </Label>
                      <Input
                        id={`gpa-${edu.id}`}
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                        placeholder="3.8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`honors-${edu.id}`} className="text-slate-600">
                        Honors (Optional)
                      </Label>
                      <Input
                        id={`honors-${edu.id}`}
                        value={edu.honors || ''}
                        onChange={(e) => updateEducation(edu.id, { honors: e.target.value })}
                        placeholder="Magna Cum Laude"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor={`edu-description-${edu.id}`} className="text-slate-600">
                      Additional Details (Optional)
                    </Label>
                    <TextareaAutosize
                      id={`edu-description-${edu.id}`}
                      value={edu.description || ''}
                      onChange={(e) => updateEducation(edu.id, { description: e.target.value })}
                      placeholder="Relevant coursework, thesis, activities, or achievements"
                      minRows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t flex gap-2">
                    {/* Duplicate Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateEducation(edu.id)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this education?')) {
                          removeEducation(edu.id);
                        }
                      }}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Add New Education Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addEducation}
        className="w-full border-dashed border-2 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}