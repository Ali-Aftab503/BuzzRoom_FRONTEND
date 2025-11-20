/**
 * Projects Form Component
 * Dynamic list with add/edit/remove functionality
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, FolderGit2, X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { AiSuggestButton } from '@/components/shared/AiSuggestButton';
import { useState } from 'react';

export function ProjectsForm() {
  const { resumeData, updateProject, addProject, removeProject } = useResumeStore();
  const { projects } = resumeData;

  const [techInputs, setTechInputs] = useState<Record<string, string>>({});

  const generateProjectPrompt = (name: string) => {
    return `Write a compelling 2-3 sentence description for a project called "${name}". Focus on the problem solved, technologies used, and measurable impact or results. Be specific and technical.`;
  };

  const handleAddTechnology = (projectId: string) => {
    const input = techInputs[projectId]?.trim();
    if (!input) return;

    const project = projects?.find(p => p.id === projectId);
    if (!project) return;

    const technologies = [...(project.technologies || []), input];
    updateProject(projectId, { technologies });
    setTechInputs({ ...techInputs, [projectId]: '' });
  };

  const handleRemoveTechnology = (projectId: string, index: number) => {
    const project = projects?.find(p => p.id === projectId);
    if (!project) return;

    const technologies = project.technologies.filter((_, i) => i !== index);
    updateProject(projectId, { technologies });
  };

  return (
    <div className="space-y-4">
      {!projects || projects.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No projects added yet</p>
          <p className="text-xs mt-1">Click the button below to showcase your work</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={[projects[0]?.id]} className="space-y-3">
          {projects.map((project, index) => (
            <AccordionItem
              key={project.id}
              value={project.id}
              className="border rounded-md px-3 bg-white"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2 text-left">
                    <FolderGit2 className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">
                      {project.name || `Project ${index + 1}`}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-3">
                <div className="space-y-4">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`project-name-${project.id}`}>Project Name *</Label>
                    <Input
                      id={`project-name-${project.id}`}
                      value={project.name}
                      onChange={(e) => updateProject(project.id, { name: e.target.value })}
                      placeholder="E-commerce Platform"
                    />
                  </div>

                  {/* Project Link */}
                  <div className="space-y-2">
                    <Label htmlFor={`project-link-${project.id}`} className="text-slate-600">
                      Project Link (Optional)
                    </Label>
                    <Input
                      id={`project-link-${project.id}`}
                      type="url"
                      value={project.link || ''}
                      onChange={(e) => updateProject(project.id, { link: e.target.value })}
                      placeholder="https://github.com/username/project"
                    />
                  </div>

                  {/* Description with AI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`project-description-${project.id}`}>
                        Description *
                      </Label>
                      {project.name && (
                        <AiSuggestButton
                          prompt={generateProjectPrompt(project.name)}
                          onComplete={(text) => updateProject(project.id, { description: text })}
                          buttonText="✨ Generate"
                          size="sm"
                        />
                      )}
                    </div>
                    <TextareaAutosize
                      id={`project-description-${project.id}`}
                      value={project.description}
                      onChange={(e) => updateProject(project.id, { description: e.target.value })}
                      placeholder="Describe what the project does, the problem it solves, and its impact..."
                      minRows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    />
                  </div>

                  {/* Technologies */}
                  <div className="space-y-2">
                    <Label>Technologies Used</Label>
                    
                    {/* Technology Tags */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {tech}
                            <button
                              type="button"
                              onClick={() => handleRemoveTechnology(project.id, idx)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add Technology Input */}
                    <div className="flex gap-2">
                      <Input
                        value={techInputs[project.id] || ''}
                        onChange={(e) => setTechInputs({ ...techInputs, [project.id]: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTechnology(project.id);
                          }
                        }}
                        placeholder="e.g., React, TypeScript, AWS"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTechnology(project.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Press Enter or click + to add</p>
                  </div>

                  {/* Remove Button */}
                  <div className="pt-2 border-t">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this project?')) {
                          removeProject(project.id);
                        }
                      }}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove This Project
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Add New Project Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addProject}
        className="w-full border-dashed border-2 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>

      {/* Helper Text */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
        <p className="font-medium mb-1">💡 Pro Tips:</p>
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li>Include personal projects, open-source contributions, or hackathons</li>
          <li>Highlight measurable results (users, downloads, stars, etc.)</li>
          <li>Link to live demos or GitHub repositories when possible</li>
        </ul>
      </div>
    </div>
  );
}