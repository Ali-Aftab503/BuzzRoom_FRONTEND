/**
 * Modern Template PDF Component
 * For PDF export using @react-pdf/renderer
 */

import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeData } from '@/lib/types';

interface ModernTemplatePDFProps {
  data: ResumeData;
}

export function ModernTemplatePDF({ data }: ModernTemplatePDFProps) {
  const { personal, summary, experience, education, skills, projects, certifications, sectionTitles } = data;
  const accentColor = data.accentColor || '#3b82f6';

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#1e293b',
    },
    header: {
      marginBottom: 20,
      borderBottom: `2px solid ${accentColor}`,
      paddingBottom: 15,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 8,
    },
    contactInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: 9,
      color: '#64748b',
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#475569',
    },
    experienceItem: {
      marginBottom: 12,
      paddingLeft: 12,
      borderLeft: `2px solid ${accentColor}30`,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    jobTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
    },
    company: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#475569',
      marginBottom: 2,
    },
    date: {
      fontSize: 9,
      color: '#64748b',
    },
    description: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#475569',
      marginTop: 4,
    },
    educationItem: {
      marginBottom: 10,
      paddingLeft: 12,
      borderLeft: `2px solid ${accentColor}30`,
    },
    degree: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
    },
    institution: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#475569',
      marginBottom: 2,
    },
    details: {
      fontSize: 9,
      color: '#64748b',
      marginTop: 2,
    },
    skillsCategory: {
      marginBottom: 8,
    },
    categoryTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
      marginBottom: 4,
    },
    skillTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: `${accentColor}15`,
      color: accentColor,
      borderRadius: 12,
    },
    projectItem: {
      marginBottom: 10,
      paddingLeft: 12,
      borderLeft: `2px solid ${accentColor}30`,
    },
    projectName: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
    },
    projectDescription: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#475569',
      marginBottom: 4,
    },
    techTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4,
    },
    techTag: {
      fontSize: 7,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: `${accentColor}10`,
      color: accentColor,
      borderRadius: 4,
    },
    certItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
    },
    certIssuer: {
      fontSize: 9,
      color: '#475569',
    },
    link: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
      marginTop: 2,
    },
  });

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    if (dateString.toLowerCase() === 'present') return 'Present';
    if (dateString.includes(' ')) return dateString;
    
    const [year, month] = dateString.split('-');
    if (year && month) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    return dateString;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personal.fullName || 'Your Name'}</Text>
          <View style={styles.contactInfo}>
            {personal.email && <Text>{personal.email}</Text>}
            {personal.phone && <Text>|  {personal.phone}</Text>}
            {personal.location && <Text>|  {personal.location}</Text>}
            {personal.website && <Text>|  {personal.website}</Text>}
            {personal.linkedin && <Text>|  {personal.linkedin}</Text>}
            {personal.github && <Text>|  {personal.github}</Text>}
          </View>
        </View>

        {/* Professional Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitles.summary}</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}

        {/* Work Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitles.experience}</Text>
            {experience.map((job) => (
              <View key={job.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>{job.jobTitle || 'Job Title'}</Text>
                    <Text style={styles.company}>
                      {job.company || 'Company Name'}
                      {job.location && ` • ${job.location}`}
                    </Text>
                  </View>
                  {job.startDate && (
                    <Text style={styles.date}>
                      {formatDate(job.startDate)} - {job.isPresent ? 'Present' : formatDate(job.endDate)}
                    </Text>
                  )}
                </View>
                {job.description && (
                  <Text style={styles.description}>{job.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitles.education}</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.experienceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.degree}>{edu.degree || 'Degree'}</Text>
                    <Text style={styles.institution}>
                      {edu.institution || 'Institution'}
                      {edu.location && ` • ${edu.location}`}
                    </Text>
                    {(edu.gpa || edu.honors) && (
                      <Text style={styles.details}>
                        {edu.gpa && `GPA: ${edu.gpa}`}
                        {edu.gpa && edu.honors && ' • '}
                        {edu.honors}
                      </Text>
                    )}
                  </View>
                  {edu.startDate && (
                    <Text style={styles.date}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Text>
                  )}
                </View>
                {edu.description && (
                  <Text style={styles.description}>{edu.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitles.skills}</Text>
            {(() => {
              const grouped = skills.reduce((acc, skill) => {
                const category = skill.category || 'General';
                if (!acc[category]) acc[category] = [];
                acc[category].push(skill);
                return acc;
              }, {} as Record<string, typeof skills>);

              return Object.entries(grouped).map(([category, categorySkills]) => (
                <View key={category} style={styles.skillsCategory}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.skillTags}>
                    {categorySkills.map((skill) => (
                      <Text key={skill.id} style={styles.skillTag}>
                        {skill.name}
                        {skill.level && ` • ${skill.level}`}
                      </Text>
                    ))}
                  </View>
                </View>
              ));
            })()}
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitles.projects}</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectName}>{project.name || 'Project Name'}</Text>
                {project.description && (
                  <Text style={styles.projectDescription}>{project.description}</Text>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techTags}>
                    {project.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techTag}>
                        {tech}
                      </Text>
                    ))}
                  </View>
                )}
                {project.link && (
                  <Link src={project.link} style={styles.link}>
                    {project.link}
                  </Link>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitles.certifications}</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>{cert.name || 'Certification Name'}</Text>
                  <Text style={styles.certIssuer}>{cert.issuer || 'Issuer'}</Text>
                  {cert.credentialId && (
                    <Text style={styles.details}>ID: {cert.credentialId}</Text>
                  )}
                  {cert.link && (
                    <Link src={cert.link} style={styles.link}>
                      Verify
                    </Link>
                  )}
                </View>
                {cert.date && (
                  <Text style={styles.date}>{formatDate(cert.date)}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}