/**
 * Work Experience Form - With Drag & Drop Reordering
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, Briefcase, Copy, GripVertical } from 'lucide-react';
import { AiSuggestButton } from '@/components/shared/AiSuggestButton';
import TextareaAutosize from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableExperienceItem({ job, index, children }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 z-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

export function ExperienceForm() {
  const { resumeData, updateWorkExperience, addWorkExperience, removeWorkExperience, duplicateWorkExperience, reorderWorkExperience } = useResumeStore();
  const { experience } = resumeData;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = experience.findIndex((item) => item.id === active.id);
      const newIndex = experience.findIndex((item) => item.id === over.id);
      reorderWorkExperience(oldIndex, newIndex);
    }
  };

  const generateJobPrompt = (jobTitle: string, company: string) => {
    return `Write 3-5 impactful bullet points for a ${jobTitle} position at ${company}. Use the STAR method (Situation, Task, Action, Result). Start each bullet with • and include quantifiable achievements. Focus on leadership, impact, and technical accomplishments.`;
  };

  return (
    <div className="space-y-4">
      {experience.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 text-slate-500"
        >
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No work experience added yet</p>
          <p className="text-xs mt-1">Click the button below to add your first job</p>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={experience.map(exp => exp.id)}
            strategy={verticalListSortingStrategy}
          >
            <Accordion type="multiple" defaultValue={[experience[0]?.id]} className="space-y-3">
              <AnimatePresence mode="popLayout">
                {experience.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <SortableExperienceItem job={job} index={index}>
                      <AccordionItem
                        value={job.id}
                        className="border rounded-md px-3 bg-white"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-2 text-left">
                              <Briefcase className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">
                                {job.jobTitle || `Job ${index + 1}`}
                                {job.company && ` at ${job.company}`}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-3">
                          <div className="space-y-4">
                            {/* Job Title */}
                            <div className="space-y-2">
                              <Label htmlFor={`job-title-${job.id}`}>Job Title *</Label>
                              <Input
                                id={`job-title-${job.id}`}
                                value={job.jobTitle}
                                onChange={(e) => updateWorkExperience(job.id, { jobTitle: e.target.value })}
                                placeholder="Senior Software Engineer"
                              />
                            </div>

                            {/* Company and Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`company-${job.id}`}>Company *</Label>
                                <Input
                                  id={`company-${job.id}`}
                                  value={job.company}
                                  onChange={(e) => updateWorkExperience(job.id, { company: e.target.value })}
                                  placeholder="Tech Corp"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`location-${job.id}`}>Location *</Label>
                                <Input
                                  id={`location-${job.id}`}
                                  value={job.location}
                                  onChange={(e) => updateWorkExperience(job.id, { location: e.target.value })}
                                  placeholder="San Francisco, CA"
                                />
                              </div>
                            </div>

                            {/* Start Date and End Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`start-date-${job.id}`}>Start Date *</Label>
                                <Input
                                  id={`start-date-${job.id}`}
                                  type="month"
                                  value={job.startDate}
                                  onChange={(e) => updateWorkExperience(job.id, { startDate: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`end-date-${job.id}`}>End Date *</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`end-date-${job.id}`}
                                    type="month"
                                    value={job.isPresent ? '' : job.endDate}
                                    onChange={(e) => updateWorkExperience(job.id, { endDate: e.target.value, isPresent: false })}
                                    disabled={job.isPresent}
                                    className={job.isPresent ? 'opacity-50' : ''}
                                  />
                                  <Button
                                    type="button"
                                    variant={job.isPresent ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateWorkExperience(job.id, { 
                                      isPresent: !job.isPresent,
                                      endDate: !job.isPresent ? 'Present' : job.endDate
                                    })}
                                  >
                                    Present
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Job Description with Enhanced AI */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`description-${job.id}`}>
                                  Description
                                  <span className="text-xs text-slate-500 font-normal ml-2">
                                    (Use bullet points: • Achievement 1)
                                  </span>
                                </Label>
                                {job.jobTitle && job.company && (
                                  <AiSuggestButton
                                    prompt={generateJobPrompt(job.jobTitle, job.company)}
                                    onComplete={(text) => updateWorkExperience(job.id, { description: text })}
                                    buttonText="Generate"
                                    size="sm"
                                    showToneSelector={true}
                                    showImproveButton={true}
                                    currentContent={job.description}
                                  />
                                )}
                              </div>
                              <TextareaAutosize
                                id={`description-${job.id}`}
                                value={job.description}
                                onChange={(e) => updateWorkExperience(job.id, { description: e.target.value })}
                                placeholder="• Led development of microservices architecture serving 1M+ users&#10;• Reduced API response time by 40% through optimization&#10;• Mentored team of 5 junior developers"
                                minRows={4}
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
                                onClick={() => duplicateWorkExperience(job.id)}
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
                                  if (confirm('Are you sure you want to remove this job?')) {
                                    removeWorkExperience(job.id);
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
                    </SortableExperienceItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Accordion>
          </SortableContext>
        </DndContext>
      )}

      {/* Add New Experience Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addWorkExperience}
        className="w-full border-dashed border-2 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Work Experience
      </Button>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Pro Tip:</p>
        <p className="text-xs">
          Drag the <GripVertical className="w-3 h-3 inline" /> icon to reorder your experiences. Most recent positions should be at the top!
        </p>
      </div>
    </div>
  );
}