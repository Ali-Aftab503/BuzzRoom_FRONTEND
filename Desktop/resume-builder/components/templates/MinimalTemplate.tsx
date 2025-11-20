'use client';

import type { ResumeData } from '@/lib/types';

interface MinimalTemplateProps {
  data: ResumeData;
}

export function MinimalTemplate({ data }: MinimalTemplateProps) {
  const { personal, summary, experience, education, skills, projects, certifications, sectionTitles } = data;
  const accentColor = data.accentColor || '#000000';

  return (
    <div className="w-full h-full bg-white p-12 text-slate-900 font-light">
      {/* Header Section - Minimal */}
      <header className="mb-12">
        <h1 className="text-6xl font-thin tracking-tight mb-6" style={{ color: accentColor }}>
          {personal.fullName || 'Your Name'}
        </h1>
        
        {/* Contact Information - Simple List */}
        <div className="text-sm text-slate-600 space-y-1">
          {personal.email && <div>{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.location && <div>{personal.location}</div>}
          {personal.website && <div>{personal.website}</div>}
          {personal.linkedin && <div>{personal.linkedin}</div>}
          {personal.github && <div>{personal.github}</div>}
        </div>
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-12">
          <h2 
            className="text-xs font-semibold tracking-widest uppercase mb-4" 
            style={{ color: accentColor }}
          >
            {sectionTitles.summary}
          </h2>
          <p className="text-slate-700 leading-loose whitespace-pre-wrap max-w-3xl">
            {summary}
          </p>
        </section>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <section className="mb-12">
          <h2 
            className="text-xs font-semibold tracking-widest uppercase mb-6" 
            style={{ color: accentColor }}
          >
            {sectionTitles.experience}
          </h2>
          <div className="space-y-8">
            {experience.map((job) => (
              <div key={job.id} className="grid grid-cols-4 gap-8">
                {/* Date Column */}
                <div className="text-sm text-slate-500">
                  {job.startDate && (
                    <>
                      {formatDateMinimal(job.startDate)} – {job.isPresent ? 'Now' : formatDateMinimal(job.endDate)}
                    </>
                  )}
                </div>
                
                {/* Content Column */}
                <div className="col-span-3">
                  <h3 className="font-medium text-lg mb-1">{job.jobTitle || 'Job Title'}</h3>
                  <p className="text-slate-600 mb-3">
                    {job.company || 'Company Name'}
                    {job.location && ` · ${job.location}`}
                  </p>
                  {job.description && (
                    <div className="text-slate-700 leading-loose whitespace-pre-wrap">
                      {job.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-12">
          <h2 
            className="text-xs font-semibold tracking-widest uppercase mb-6" 
            style={{ color: accentColor }}
          >
            {sectionTitles.education}
          </h2>
          <div className="space-y-6">
            {education.map((edu) => (
              <div key={edu.id} className="grid grid-cols-4 gap-8">
                {/* Date Column */}
                <div className="text-sm text-slate-500">
                  {edu.startDate && (
                    <>
                      {formatDateMinimal(edu.startDate)} – {formatDateMinimal(edu.endDate)}
                    </>
                  )}
                </div>
                
                {/* Content Column */}
                <div className="col-span-3">
                  <h3 className="font-medium text-lg mb-1">{edu.degree || 'Degree'}</h3>
                  <p className="text-slate-600">
                    {edu.institution || 'Institution'}
                    {edu.location && ` · ${edu.location}`}
                  </p>
                  {(edu.gpa || edu.honors) && (
                    <p className="text-sm text-slate-500 mt-2">
                      {edu.gpa && `GPA: ${edu.gpa}`}
                      {edu.gpa && edu.honors && ' · '}
                      {edu.honors}
                    </p>
                  )}
                  {edu.description && (
                    <p className="text-slate-700 mt-3 leading-loose whitespace-pre-wrap">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-12">
          <h2 
            className="text-xs font-semibold tracking-widest uppercase mb-6" 
            style={{ color: accentColor }}
          >
            {sectionTitles.skills}
          </h2>
          <div className="grid grid-cols-4 gap-8">
            <div></div>
            <div className="col-span-3 space-y-4">
              {(() => {
                const grouped = skills.reduce((acc, skill) => {
                  const category = skill.category || 'General';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(skill);
                  return acc;
                }, {} as Record<string, typeof skills>);

                return Object.entries(grouped).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-700">
                      {categorySkills.map((skill) => (
                        <span key={skill.id}>
                          {skill.name}
                          {skill.level && ` (${skill.level})`}
                        </span>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-12">
          <h2 
            className="text-xs font-semibold tracking-widest uppercase mb-6" 
            style={{ color: accentColor }}
          >
            {sectionTitles.projects}
          </h2>
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="grid grid-cols-4 gap-8">
                <div></div>
                <div className="col-span-3">
                  <h3 className="font-medium text-lg mb-2">{project.name || 'Project Name'}</h3>
                  {project.description && (
                    <p className="text-slate-700 leading-loose whitespace-pre-wrap mb-3">
                      {project.description}
                    </p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx}>{tech}</span>
                      ))}
                    </div>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      className="text-sm mt-3 inline-block hover:underline"
                      style={{ color: accentColor }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.link}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="mb-12">
          <h2 
            className="text-xs font-semibold tracking-widest uppercase mb-6" 
            style={{ color: accentColor }}
          >
            {sectionTitles.certifications}
          </h2>
          <div className="space-y-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="grid grid-cols-4 gap-8">
                {/* Date Column */}
                <div className="text-sm text-slate-500">
                  {cert.date && formatDateMinimal(cert.date)}
                </div>
                
                {/* Content Column */}
                <div className="col-span-3">
                  <h3 className="font-medium">{cert.name || 'Certification Name'}</h3>
                  <p className="text-slate-600">{cert.issuer || 'Issuer'}</p>
                  {cert.credentialId && (
                    <p className="text-sm text-slate-500 mt-1">ID: {cert.credentialId}</p>
                  )}
                  {cert.link && (
                    <a
                      href={cert.link}
                      className="text-sm mt-2 inline-block hover:underline"
                      style={{ color: accentColor }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatDateMinimal(dateString: string): string {
  if (!dateString) return '';
  if (dateString.toLowerCase() === 'present') return 'Now';
  if (dateString.includes(' ')) return dateString;
  
  const [year, month] = dateString.split('-');
  if (year && month) {
    return `${month}/${year}`;
  }
  
  return dateString;
}