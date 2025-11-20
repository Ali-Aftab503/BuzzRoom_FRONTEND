/**
 * Zustand Store for Resume Data
 * Fixed with proper types and example data
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ResumeData,
  PersonalDetails,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  SectionTitleKey,
} from '@/lib/types';

// Default empty resume
export const DEFAULT_RESUME_DATA: ResumeData = {
  personal: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  sectionTitles: {
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
  },
  template: 'modern',
  accentColor: '#3b82f6',
  lastModified: new Date().toISOString(),
  version: '1.0.0',
};

// Example resume data for demo
export const EXAMPLE_RESUME_DATA: ResumeData = {
  personal: {
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'https://sarahjohnson.dev',
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    github: 'https://github.com/sarahjohnson',
  },
  summary: 'Results-driven Senior Software Engineer with 6+ years of experience building scalable web applications. Specialized in React, TypeScript, and cloud architecture. Led teams to deliver high-impact projects that improved user engagement by 40% and reduced costs by $2M annually. Passionate about clean code, mentorship, and solving complex technical challenges.',
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Innovations Inc.',
      location: 'San Francisco, CA',
      startDate: '2021-03',
      endDate: 'Present',
      isPresent: true,
      description: `• Led development of microservices architecture serving 2M+ daily active users, improving system reliability by 45%
• Architected and implemented real-time collaboration features using WebSocket, increasing user engagement by 60%
• Mentored team of 5 junior developers, conducting code reviews and establishing best practices
• Optimized database queries and caching strategies, reducing API response time by 40%
• Spearheaded migration from monolith to microservices, reducing deployment time from 2 hours to 15 minutes`,
    },
    {
      id: 'exp-2',
      jobTitle: 'Full Stack Developer',
      company: 'Digital Solutions Co.',
      location: 'Austin, TX',
      startDate: '2019-01',
      endDate: '2021-02',
      isPresent: false,
      description: `• Built responsive web applications using React, Node.js, and PostgreSQL for 5+ enterprise clients
• Implemented CI/CD pipeline using GitHub Actions and Docker, reducing deployment errors by 80%
• Developed RESTful APIs handling 100K+ requests per day with 99.9% uptime
• Collaborated with UX designers to create intuitive user interfaces, improving NPS score by 25 points
• Reduced page load time by 50% through code splitting and lazy loading optimization`,
    },
    {
      id: 'exp-3',
      jobTitle: 'Junior Software Developer',
      company: 'StartupXYZ',
      location: 'Remote',
      startDate: '2018-06',
      endDate: '2018-12',
      isPresent: false,
      description: `• Developed new features for e-commerce platform serving 50K+ monthly users
• Implemented responsive designs using React and Tailwind CSS
• Fixed 100+ bugs and improved test coverage from 40% to 75%
• Participated in agile development process with daily standups and sprint planning`,
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      startDate: '2014-09',
      endDate: '2018-05',
      gpa: '3.8',
      honors: 'Magna Cum Laude',
      description: 'Relevant Coursework: Data Structures, Algorithms, Database Systems, Web Development, Machine Learning',
    },
  ],
  skills: [
    { id: 'skill-1', name: 'JavaScript', category: 'Programming', level: 'Expert' },
    { id: 'skill-2', name: 'TypeScript', category: 'Programming', level: 'Expert' },
    { id: 'skill-3', name: 'Python', category: 'Programming', level: 'Advanced' },
    { id: 'skill-4', name: 'React', category: 'Frontend', level: 'Expert' },
    { id: 'skill-5', name: 'Next.js', category: 'Frontend', level: 'Advanced' },
    { id: 'skill-6', name: 'Tailwind CSS', category: 'Frontend', level: 'Advanced' },
    { id: 'skill-7', name: 'Node.js', category: 'Backend', level: 'Expert' },
    { id: 'skill-8', name: 'Express', category: 'Backend', level: 'Advanced' },
    { id: 'skill-9', name: 'PostgreSQL', category: 'Database', level: 'Advanced' },
    { id: 'skill-10', name: 'MongoDB', category: 'Database', level: 'Intermediate' },
    { id: 'skill-11', name: 'AWS', category: 'Cloud', level: 'Advanced' },
    { id: 'skill-12', name: 'Docker', category: 'DevOps', level: 'Advanced' },
    { id: 'skill-13', name: 'Git', category: 'Tools', level: 'Expert' },
    { id: 'skill-14', name: 'Leadership', category: 'Soft Skills', level: 'Advanced' },
    { id: 'skill-15', name: 'Communication', category: 'Soft Skills', level: 'Expert' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Open Source Task Manager',
      description: 'Built a collaborative task management tool with real-time updates, used by 10K+ users. Features include drag-and-drop boards, team collaboration, and integrations with Slack and GitHub.',
      technologies: ['React', 'TypeScript', 'WebSocket', 'Node.js', 'PostgreSQL', 'Redis'],
      link: 'https://github.com/sarahjohnson/task-manager',
    },
    {
      id: 'proj-2',
      name: 'AI-Powered Code Review Assistant',
      description: 'Created a VS Code extension that uses GPT-4 to provide intelligent code review suggestions. Achieved 5K+ downloads in first month.',
      technologies: ['TypeScript', 'OpenAI API', 'VS Code API'],
      link: 'https://marketplace.visualstudio.com/code-reviewer',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023-06',
      credentialId: 'AWS-SA-123456',
    },
    {
      id: 'cert-2',
      name: 'Professional Scrum Master I',
      issuer: 'Scrum.org',
      date: '2022-03',
      credentialId: 'PSM-789012',
    },
  ],
  sectionTitles: {
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Technical Skills',
    projects: 'Notable Projects',
    certifications: 'Certifications',
  },
  template: 'modern',
  accentColor: '#3b82f6',
  lastModified: new Date().toISOString(),
  version: '1.0.0',
};

interface ResumeStore {
  resumeData: ResumeData;
  updatePersonal: (details: Partial<PersonalDetails>) => void;
  updateSummary: (summary: string) => void;
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, experience: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;
  reorderWorkExperience: (startIndex: number, endIndex: number) => void;
  duplicateWorkExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, education: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (startIndex: number, endIndex: number) => void;
  duplicateEducation: (id: string) => void;
  addSkill: () => void;
  updateSkill: (id: string, skill: Partial<Skill>) => void;
  removeSkill: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addCertification: () => void;
  updateCertification: (id: string, certification: Partial<Certification>) => void;
  removeCertification: (id: string) => void;
  updateSectionTitle: (section: SectionTitleKey, title: string) => void;
  setTemplate: (template: ResumeData['template']) => void;
  setAccentColor: (color: string) => void;
  setSectionOrder: (newOrder: string[]) => void;
  setResumeData: (data: ResumeData) => void;
  resetResume: () => void;
  loadExample: () => void;
}

interface SectionOrderState {
  sectionOrder: string[];
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const reorderArray = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const useResumeStore = create<ResumeStore & SectionOrderState>()(
  persist(
    (set) => ({
      resumeData: DEFAULT_RESUME_DATA,
      sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],

      updatePersonal: (details) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            personal: { ...state.resumeData.personal, ...details },
            lastModified: new Date().toISOString(),
          },
        })),

      updateSummary: (summary) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            summary,
            lastModified: new Date().toISOString(),
          },
        })),

      addWorkExperience: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: [
              ...state.resumeData.experience,
              {
                id: generateId('exp'),
                jobTitle: '',
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                description: '',
                isPresent: false,
              },
            ],
            lastModified: new Date().toISOString(),
          },
        })),

      updateWorkExperience: (id, experience) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: state.resumeData.experience.map((exp) =>
              exp.id === id ? { ...exp, ...experience } : exp
            ),
            lastModified: new Date().toISOString(),
          },
        })),

      removeWorkExperience: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: state.resumeData.experience.filter((exp) => exp.id !== id),
            lastModified: new Date().toISOString(),
          },
        })),

      reorderWorkExperience: (startIndex, endIndex) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: reorderArray(state.resumeData.experience, startIndex, endIndex),
            lastModified: new Date().toISOString(),
          },
        })),

      duplicateWorkExperience: (id) =>
        set((state) => {
          const original = state.resumeData.experience.find((exp) => exp.id === id);
          if (!original) return state;
          
          const duplicate = {
            ...original,
            id: generateId('exp'),
            jobTitle: `${original.jobTitle} (Copy)`,
          };
          
          const index = state.resumeData.experience.findIndex((exp) => exp.id === id);
          const newExperience = [...state.resumeData.experience];
          newExperience.splice(index + 1, 0, duplicate);
          
          return {
            resumeData: {
              ...state.resumeData,
              experience: newExperience,
              lastModified: new Date().toISOString(),
            },
          };
        }),

      addEducation: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: [
              ...state.resumeData.education,
              {
                id: generateId('edu'),
                degree: '',
                institution: '',
                location: '',
                startDate: '',
                endDate: '',
              },
            ],
            lastModified: new Date().toISOString(),
          },
        })),

      updateEducation: (id, education) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((edu) =>
              edu.id === id ? { ...edu, ...education } : edu
            ),
            lastModified: new Date().toISOString(),
          },
        })),

      removeEducation: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.filter((edu) => edu.id !== id),
            lastModified: new Date().toISOString(),
          },
        })),

      reorderEducation: (startIndex, endIndex) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: reorderArray(state.resumeData.education, startIndex, endIndex),
            lastModified: new Date().toISOString(),
          },
        })),

      duplicateEducation: (id) =>
        set((state) => {
          const original = state.resumeData.education.find((edu) => edu.id === id);
          if (!original) return state;
          
          const duplicate = {
            ...original,
            id: generateId('edu'),
            degree: `${original.degree} (Copy)`,
          };
          
          const index = state.resumeData.education.findIndex((edu) => edu.id === id);
          const newEducation = [...state.resumeData.education];
          newEducation.splice(index + 1, 0, duplicate);
          
          return {
            resumeData: {
              ...state.resumeData,
              education: newEducation,
              lastModified: new Date().toISOString(),
            },
          };
        }),

      addSkill: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: [
              ...state.resumeData.skills,
              {
                id: generateId('skill'),
                name: '',
                category: '',
              },
            ],
            lastModified: new Date().toISOString(),
          },
        })),

      updateSkill: (id, skill) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.map((s) =>
              s.id === id ? { ...s, ...skill } : s
            ),
            lastModified: new Date().toISOString(),
          },
        })),

      removeSkill: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.filter((s) => s.id !== id),
            lastModified: new Date().toISOString(),
          },
        })),

      addProject: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: [
              ...(state.resumeData.projects || []),
              {
                id: generateId('proj'),
                name: '',
                description: '',
                technologies: [],
              },
            ],
            lastModified: new Date().toISOString(),
          },
        })),

      updateProject: (id, project) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: (state.resumeData.projects || []).map((p) =>
              p.id === id ? { ...p, ...project } : p
            ),
            lastModified: new Date().toISOString(),
          },
        })),

      removeProject: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: (state.resumeData.projects || []).filter((p) => p.id !== id),
            lastModified: new Date().toISOString(),
          },
        })),

      addCertification: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: [
              ...(state.resumeData.certifications || []),
              {
                id: generateId('cert'),
                name: '',
                issuer: '',
                date: '',
              },
            ],
            lastModified: new Date().toISOString(),
          },
        })),

      updateCertification: (id, certification) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: (state.resumeData.certifications || []).map((c) =>
              c.id === id ? { ...c, ...certification } : c
            ),
            lastModified: new Date().toISOString(),
          },
        })),

      removeCertification: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: (state.resumeData.certifications || []).filter((c) => c.id !== id),
            lastModified: new Date().toISOString(),
          },
        })),

      updateSectionTitle: (section, title) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            sectionTitles: {
              ...state.resumeData.sectionTitles,
              [section]: title,
            },
            lastModified: new Date().toISOString(),
          },
        })),

      setTemplate: (template) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            template,
            lastModified: new Date().toISOString(),
          },
        })),

      setAccentColor: (color) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            accentColor: color,
            lastModified: new Date().toISOString(),
          },
        })),

      setResumeData: (data) =>
        set(() => ({
          resumeData: {
            ...data,
            lastModified: new Date().toISOString(),
          },
        })),

      resetResume: () =>
        set(() => ({
          resumeData: {
            ...DEFAULT_RESUME_DATA,
            lastModified: new Date().toISOString(),
          },
        })),

      loadExample: () =>
        set(() => ({
          resumeData: {
            ...EXAMPLE_RESUME_DATA,
            lastModified: new Date().toISOString(),
          },
        })),

      setSectionOrder: (newOrder) =>
        set(() => ({
          sectionOrder: newOrder,
        })),
    }),
    {
      name: 'resume-storage',
      version: 1,
    }
  )
);