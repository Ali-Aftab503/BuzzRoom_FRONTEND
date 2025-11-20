/**
 * Personal Details Form - FIXED (No more controlled/uncontrolled errors)
 * File: components/editor/PersonalDetailsForm.tsx
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PersonalDetailsForm() {
  const { resumeData, updatePersonal } = useResumeStore();
  const { personal } = resumeData;

  return (
    <div className="space-y-6">
      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={personal.firstName || ''}
            onChange={(e) => updatePersonal({ firstName: e.target.value })}
            placeholder="Ali"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={personal.lastName || ''}
            onChange={(e) => updatePersonal({ lastName: e.target.value })}
            placeholder="Aftab"
            className="h-12"
          />
        </div>
      </div>

      {/* Job Title */}
      <div className="space-y-2">
        <Label htmlFor="jobTitle" className="text-sm font-medium text-slate-700">
          Job Title
        </Label>
        <Input
          id="jobTitle"
          type="text"
          value={personal.jobTitle || ''}
          onChange={(e) => updatePersonal({ jobTitle: e.target.value })}
          placeholder="Front End React Developer"
          className="h-12"
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium text-slate-700">
          Address
        </Label>
        <Input
          id="address"
          type="text"
          value={personal.location || ''}
          onChange={(e) => updatePersonal({ location: e.target.value })}
          placeholder="Sahiwal"
          className="h-12"
        />
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={personal.phone || ''}
            onChange={(e) => updatePersonal({ phone: e.target.value })}
            placeholder="123-456-789"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={personal.email || ''}
            onChange={(e) => updatePersonal({ email: e.target.value })}
            placeholder="example@gmail.com"
            className="h-12"
          />
        </div>
      </div>

      {/* Website, LinkedIn, GitHub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium text-slate-600">
            Website (Optional)
          </Label>
          <Input
            id="website"
            type="url"
            value={personal.website || ''}
            onChange={(e) => updatePersonal({ website: e.target.value })}
            placeholder="https://yoursite.com"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin" className="text-sm font-medium text-slate-600">
            LinkedIn (Optional)
          </Label>
          <Input
            id="linkedin"
            type="url"
            value={personal.linkedin || ''}
            onChange={(e) => updatePersonal({ linkedin: e.target.value })}
            placeholder="linkedin.com/in/username"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github" className="text-sm font-medium text-slate-600">
            GitHub (Optional)
          </Label>
          <Input
            id="github"
            type="url"
            value={personal.github || ''}
            onChange={(e) => updatePersonal({ github: e.target.value })}
            placeholder="github.com/username"
            className="h-12"
          />
        </div>
      </div>
    </div>
  );
}