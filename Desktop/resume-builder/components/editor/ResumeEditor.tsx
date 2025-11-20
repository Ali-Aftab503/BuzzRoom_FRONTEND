/**
 * Resume Editor with Multi-Step Wizard - FIXED VERSION
 * File: components/editor/ResumeEditor.tsx
 * REPLACE YOUR CURRENT ResumeEditor.tsx WITH THIS
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { SummaryForm } from './SummaryForm';
import { ExperienceForm } from './ExperienceForm';
import { EducationForm } from './EducationForm';
import { SkillsForm } from './SkillsForm';
import { ProjectsForm } from './ProjectsForm';
import { CertificationsForm } from './CertificationsForm';
import { useResumeStore } from '@/store/resumeStore';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ResumeEditor() {
  const [currentStep, setCurrentStep] = useState(0);
  const { resumeData } = useResumeStore();

  const steps = [
    {
      id: 'personal',
      title: 'Personal Details',
      description: 'Basic contact information',
      component: <PersonalDetailsForm />,
      icon: '👤',
    },
    {
      id: 'summary',
      title: 'Summary',
      description: 'Professional summary',
      component: <SummaryForm />,
      icon: '📝',
    },
    {
      id: 'experience',
      title: 'Experience',
      description: 'Work history',
      component: <ExperienceForm />,
      icon: '💼',
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Academic background',
      component: <EducationForm />,
      icon: '🎓',
    },
    {
      id: 'skills',
      title: 'Skills',
      description: 'Technical & soft skills',
      component: <SkillsForm />,
      icon: '⚡',
    },
    {
      id: 'projects',
      title: 'Projects',
      description: 'Portfolio & side projects',
      component: <ProjectsForm />,
      icon: '🚀',
    },
    {
      id: 'certifications',
      title: 'Certifications',
      description: 'Professional credentials',
      component: <CertificationsForm />,
      icon: '🏆',
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps - FIXED */}
      <Card className="p-4 sm:p-6 bg-white">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-lg">{step.icon}</span>
                  )}
                </button>

                {/* Step Label - Hidden on small screens */}
                <div className="ml-2 hidden lg:block min-w-0 flex-shrink-0">
                  <p className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
                    {step.title}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`h-1 w-8 mx-2 rounded flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Current step title */}
        <div className="lg:hidden mt-4 text-center border-t pt-4">
          <p className="text-base font-semibold text-slate-900">{currentStepData.title}</p>
          <p className="text-sm text-slate-600">{currentStepData.description}</p>
        </div>
      </Card>

      {/* Step Counter */}
      <div className="text-center">
        <p className="text-sm text-slate-600">Step {currentStep + 1} of {steps.length}</p>
      </div>

      {/* Current Step Content */}
      <Card className="p-6 bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step Header */}
            <div className="mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-3xl">{currentStepData.icon}</span>
                {currentStepData.title}
              </h2>
              <p className="text-slate-600 mt-1">{currentStepData.description}</p>
            </div>

            {/* Step Form */}
            <div>{currentStepData.component}</div>
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Navigation Buttons */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={isFirstStep}
            variant="outline"
            size="lg"
            className="min-w-[120px]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-slate-600 font-medium">
            {currentStep + 1} / {steps.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={isLastStep}
            size="lg"
            className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
            {isLastStep && <Check className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div>
            <span className="text-slate-700 font-medium">Progress:</span>
            <span className="ml-2 text-blue-600 font-bold text-lg">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">{resumeData.experience.length}</span> Jobs
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">{resumeData.education.length}</span> Degrees
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">{resumeData.skills.length}</span> Skills
            </span>
            {resumeData.projects && resumeData.projects.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-900">{resumeData.projects.length}</span> Projects
                </span>
              </>
            )}
            {resumeData.certifications && resumeData.certifications.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-900">{resumeData.certifications.length}</span> Certs
                </span>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}