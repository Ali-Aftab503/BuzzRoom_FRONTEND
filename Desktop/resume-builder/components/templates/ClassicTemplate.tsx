/**
 * Classic Template Component
 * Traditional, professional resume layout with serif fonts
 * File: components/templates/ClassicTemplate.tsx
 */

'use client';

import type { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

interface ClassicTemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const { personal, summary, experience, education, skills, projects, certifications, sectionTitles } = data;
  const accentColor = data.accentColor || '#1e293b';

  return (
    <div className="w-full h-full bg-white p-12 text-slate-900">
      {/* Header Section - Centered */}
      <header className="text-center border-b-4 pb-6 mb-6" style={{ borderColor: accentColor }}>
        <h1 className="text-5xl font-serif font-bold mb-4" style={{ color: accentColor }}>
          {personal.fullName || 'Your Name'}
        </h1>
        
        {/* Contact Information - Centered */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-700">
          {personal.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{personal.email}</span>
            </div>
          )}
          {personal.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{personal.phone}</span>
            </div>
          )}
          {personal.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{personal.location}</span>
            </div>
          )}
        </div>
        
        {/* Social Links */}
        {(personal.website || personal.linkedin || personal.github) && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600 mt-2">
            {personal.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{personal.website}</span>
              </div>
            )}
            {personal.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{personal.linkedin}</span>
              </div>
            )}
            {personal.github && (
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{personal.github}</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-8">
          <h2 
            className="text-xl font-serif font-bold mb-3 pb-2 border-b-2" 
            style={{ color: accentColor, borderColor: accentColor }}
          >
            {sectionTitles.summary}
          </h2>
          <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">
            {summary}
          </p>
        </section>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-xl font-serif font-bold mb-4 pb-2 border-b-2" 
            style={{ color: accentColor, borderColor: accentColor }}
          >
            {sectionTitles.experience}
          </h2>
          <div className="space-y-6">
            {experience.map((job) => (
              <div key={job.id}>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{job.jobTitle || 'Job Title'}</h3>
                    <p className="text-slate-700 italic">
                      {job.company || 'Company Name'}
                      {job.location && ` — ${job.location}`}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600 whitespace-nowrap ml-4 font-semibold">
                    {job.startDate && (
                      <>
                        {formatDate(job.startDate)} – {job.isPresent ? 'Present' : formatDate(job.endDate)}
                      </>
                    )}
                  </span>
                </div>
                {job.description && (
                  <div className="text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed pl-6">
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
        <section className="mb-8">
          <h2 
            className="text-xl font-serif font-bold mb-4 pb-2 border-b-2" 
            style={{ color: accentColor, borderColor: accentColor }}
          >
            {sectionTitles.education}
          </h2>
          <div className="space-y-5">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <h3 className="font-bold text-lg">{edu.degree || 'Degree'}</h3>
                    <p className="text-slate-700 italic">
                      {edu.institution || 'Institution'}
                      {edu.location && ` — ${edu.location}`}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600 whitespace-nowrap ml-4 font-semibold">
                    {edu.startDate && (
                      <>
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </>
                    )}
                  </span>
                </div>
                {(edu.gpa || edu.honors) && (
                  <p className="text-sm text-slate-600 pl-6">
                    {edu.gpa && `GPA: ${edu.gpa}`}
                    {edu.gpa && edu.honors && ' | '}
                    {edu.honors}
                  </p>
                )}
                {edu.description && (
                  <p className="text-slate-700 mt-2 pl-6 whitespace-pre-wrap">
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
        <section className="mb-8">
          <h2 
            className="text-xl font-serif font-bold mb-4 pb-2 border-b-2" 
            style={{ color: accentColor, borderColor: accentColor }}
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
                <div key={category} className="flex gap-4">
                  <h4 className="font-bold text-slate-900 min-w-[120px]">{category}:</h4>
                  <p className="text-slate-700">
                    {categorySkills.map((skill, idx) => (
                      <span key={skill.id}>
                        {skill.name}
                        {skill.level && ` (${skill.level})`}
                        {idx < categorySkills.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-xl font-serif font-bold mb-4 pb-2 border-b-2" 
            style={{ color: accentColor, borderColor: accentColor }}
          >
            {sectionTitles.projects}
          </h2>
          <div className="space-y-5">
            {projects.map((project) => (
              <div key={project.id}>
                <h3 className="font-bold text-lg mb-1">{project.name || 'Project Name'}</h3>
                {project.description && (
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-6">
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-sm text-slate-600 mt-2 pl-6">
                    <span className="font-semibold">Technologies:</span> {project.technologies.join(', ')}
                  </p>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    className="text-sm mt-2 inline-block hover:underline pl-6"
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
        <section className="mb-8">
          <h2 
            className="text-xl font-serif font-bold mb-4 pb-2 border-b-2" 
            style={{ color: accentColor, borderColor: accentColor }}
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
                    <p className="text-sm text-slate-600">Credential ID: {cert.credentialId}</p>
                  )}
                  {cert.link && (
                    <a
                      href={cert.link}
                      className="text-sm hover:underline"
                      style={{ color: accentColor }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify Credential
                    </a>
                  )}
                </div>
                <span className="text-sm text-slate-600 whitespace-nowrap ml-4 font-semibold">
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