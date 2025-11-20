/**
 * Core TypeScript interfaces for the Resume Builder
 * FIXED: Added firstName and lastName to PersonalDetails
 */

// Personal contact information
export interface PersonalDetails {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

// Professional work experience entry
export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  isPresent?: boolean;
}

// Educational background entry
export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
  description?: string;
}

// Skill entry with optional proficiency level
export interface Skill {
  id: string;
  name: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

// Project entry
export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  startDate?: string;
  endDate?: string;
}

// Certification entry
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  link?: string;
}

// Main resume data structure
export interface ResumeData {
  personal: PersonalDetails;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  
  sectionTitles: {
    summary: string;
    experience: string;
    education: string;
    skills: string;
    projects: string;
    certifications: string;
  };
  
  template: 'modern' | 'classic' | 'minimal';
  accentColor?: string;
  lastModified: string;
  version: string;
}

export type SectionKey = keyof Omit<ResumeData, 'personal' | 'summary' | 'sectionTitles' | 'template' | 'accentColor' | 'lastModified' | 'version'>;
export type ArraySection = ResumeData['experience'] | ResumeData['education'] | ResumeData['skills'] | ResumeData['projects'] | ResumeData['certifications'];
export type SectionTitleKey = keyof ResumeData['sectionTitles'];
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Helper type for tone selection
export type AITone = 'professional' | 'creative' | 'technical' | 'casual';

// ATS Score data
export interface ATSScore {
  score: number;
  issues: string[];
  suggestions: string[];
  keywords: string[];
  missingKeywords: string[];
}