/**
 * Modern Template Component - FIXED
 * File: components/templates/ModernTemplate.tsx
 */

'use client';

import type { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

interface ModernTemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const { personal, summary, experience, education, skills, projects, certifications, sectionTitles } = data;
  const accentColor = data.accentColor || '#3b82f6';

  // Get full name - FIX for name not showing
  const displayName = personal.fullName || `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Your Name';

  return (
    <div className="w-full h-full bg-white p-12 text-slate-900">
      {/* Header Section */}
      <header className="border-b-2 pb-6 mb-6" style={{ borderColor: accentColor }}>
        <h1 className="text-4xl font-bold mb-3" style={{ color: accentColor }}>
          {displayName}
        </h1>
        
        {/* Contact Information */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          {personal.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" style={{ color: accentColor }} />
              <span>{personal.email}</span>
            </div>
          )}
          {personal.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" style={{ color: accentColor }} />
              <span>{personal.phone}</span>
            </div>
          )}
          {personal.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: accentColor }} />
              <span>{personal.location}</span>
            </div>
          )}
          {personal.website && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" style={{ color: accentColor }} />
              <span className="truncate max-w-[200px]">{personal.website}</span>
            </div>
          )}
          {personal.linkedin && (
            <div className="flex items-center gap-1.5">
              <Linkedin className="w-4 h-4" style={{ color: accentColor }} />
              <span className="truncate max-w-[200px]">{personal.linkedin}</span>
            </div>
          )}
          {personal.github && (
            <div className="flex items-center gap-1.5">
              <Github className="w-4 h-4" style={{ color: accentColor }} />
              <span className="truncate max-w-[200px]">{personal.github}</span>
            </div>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-6">
          <h2 
            className="text-xl font-bold mb-3 uppercase tracking-wide" 
            style={{ color: accentColor }}
          >
            {sectionTitles.summary}
          </h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </section>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-xl font-bold mb-4 uppercase tracking-wide" 
            style={{ color: accentColor }}
          >
            {sectionTitles.experience}
          </h2>
          <div className="space-y-5">
            {experience.map((job) => (
              <div key={job.id} className="relative pl-4 border-l-2" style={{ borderColor: accentColor + '40' }}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-lg">{job.jobTitle || 'Job Title'}</h3>
                    <p className="text-slate-700 font-medium">
                      {job.company || 'Company Name'}
                      {job.location && ` • ${job.location}`}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600 whitespace-nowrap ml-4">
                    {job.startDate && (
                      <>
                        {formatDate(job.startDate)} - {job.isPresent ? 'Present' : formatDate(job.endDate)}
                      </>
                    )}
                  </span>
                </div>
                {job.description && (
                  <div className="text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-xl font-bold mb-4 uppercase tracking-wide" 
            style={{ color: accentColor }}
          >
            {sectionTitles.education}
          </h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="relative pl-4 border-l-2" style={{ borderColor: accentColor + '40' }}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-lg">{edu.degree || 'Degree'}</h3>
                    <p className="text-slate-700 font-medium">
                      {edu.institution || 'Institution'}
                      {edu.location && ` • ${edu.location}`}
                    </p>
                    {(edu.gpa || edu.honors) && (
                      <p className="text-sm text-slate-600 mt-1">
                        {edu.gpa && `GPA: ${edu.gpa}`}
                        {edu.gpa && edu.honors && ' • '}
                        {edu.honors}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-slate-600 whitespace-nowrap ml-4">
                    {edu.startDate && (
                      <>
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </>
                    )}
                  </span>
                </div>
                {edu.description && (
                  <p className="text-slate-700 mt-2 whitespace-pre-wrap">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-xl font-bold mb-4 uppercase tracking-wide" 
            style={{ color: accentColor }}
          >
            {sectionTitles.skills}
          </h2>
          <div className="space-y-3">
            {(() => {
              const grouped = skills.reduce((acc, skill) => {
                const category = skill.category || 'General';
                if (!acc[category]) acc[category] = [];
                acc[category].push(skill);
                return acc;
              }, {} as Record<string, typeof skills>);

              return Object.entries(grouped).map(([category, categorySkills]) => (
                <div key={category}>
                  <h4 className="font-semibold text-slate-800 mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: accentColor + '15',
                          color: accentColor,
                        }}
                      >
                        {skill.name}
                        {skill.level && ` • ${skill.level}`}
                      </span>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-xl font-bold mb-4 uppercase tracking-wide" 
            style={{ color: accentColor }}
          >
            {sectionTitles.projects}
          </h2>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="relative pl-4 border-l-2" style={{ borderColor: accentColor + '40' }}>
                <h3 className="font-bold text-lg">{project.name || 'Project Name'}</h3>
                {project.description && (
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: accentColor + '10',
                          color: accentColor,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    className="text-sm mt-2 inline-block hover:underline"
                    style={{ color: accentColor }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.link}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-xl font-bold mb-4 uppercase tracking-wide" 
            style={{ color: accentColor }}
          >
            {sectionTitles.certifications}
          </h2>
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{cert.name || 'Certification Name'}</h3>
                  <p className="text-slate-700">{cert.issuer || 'Issuer'}</p>
                  {cert.credentialId && (
                    <p className="text-sm text-slate-600">ID: {cert.credentialId}</p>
                  )}
                  {cert.link && (
                    <a
                      href={cert.link}
                      className="text-sm hover:underline"
                      style={{ color: accentColor }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify
                    </a>
                  )}
                </div>
                <span className="text-sm text-slate-600 whitespace-nowrap ml-4">
                  {cert.date && formatDate(cert.date)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  if (dateString.toLowerCase() === 'present') return 'Present';
  if (dateString.includes(' ')) return dateString;
  
  const [year, month] = dateString.split('-');
  if (year && month) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  
  return dateString;
}