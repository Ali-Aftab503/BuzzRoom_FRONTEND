/**
 * Skills Form Component
 * Dynamic list with add/edit/remove functionality
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Sparkles } from 'lucide-react';

export function SkillsForm() {
  const { resumeData, updateSkill, addSkill, removeSkill } = useResumeStore();
  const { skills } = resumeData;

  return (
    <div className="space-y-4">
      {skills.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No skills added yet</p>
          <p className="text-xs mt-1">Click the button below to add your skills</p>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill, index) => (
            <div
              key={skill.id}
              className="border rounded-md p-4 bg-white space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Skill {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this skill?')) {
                      removeSkill(skill.id);
                    }
                  }}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Skill Name */}
                <div className="space-y-2">
                  <Label htmlFor={`skill-name-${skill.id}`}>Skill Name *</Label>
                  <Input
                    id={`skill-name-${skill.id}`}
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                    placeholder="JavaScript, Leadership, etc."
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor={`skill-category-${skill.id}`}>Category</Label>
                  <Input
                    id={`skill-category-${skill.id}`}
                    value={skill.category || ''}
                    onChange={(e) => updateSkill(skill.id, { category: e.target.value })}
                    placeholder="Programming, Tools, etc."
                    list={`category-suggestions-${skill.id}`}
                  />
                  <datalist id={`category-suggestions-${skill.id}`}>
                    <option value="Programming" />
                    <option value="Frontend" />
                    <option value="Backend" />
                    <option value="Database" />
                    <option value="Cloud" />
                    <option value="DevOps" />
                    <option value="Tools" />
                    <option value="Languages" />
                    <option value="Soft Skills" />
                  </datalist>
                </div>
              </div>

              {/* Proficiency Level */}
              <div className="space-y-2">
                <Label htmlFor={`skill-level-${skill.id}`}>Proficiency Level (Optional)</Label>
                <Select
                  value={skill.level || ''}
                  onValueChange={(value) => updateSkill(skill.id, { level: value as any })}
                >
                  <SelectTrigger id={`skill-level-${skill.id}`}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Skill Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addSkill}
        className="w-full border-dashed border-2 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Skill
      </Button>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Pro Tips:</p>
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li>Group similar skills using the same category</li>
          <li>List skills most relevant to your target job first</li>
          <li>Include both technical and soft skills</li>
        </ul>
      </div>
    </div>
  );
}
