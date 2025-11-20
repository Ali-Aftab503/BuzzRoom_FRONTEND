/**
 * Section Reorder Component
 * Allows users to reorder resume sections via drag & drop
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useResumeStore } from '@/store/resumeStore';
import { X, GripVertical, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SectionReorderProps {
  onClose: () => void;
}

interface SectionItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const SECTION_ITEMS: SectionItem[] = [
  { id: 'personal', label: 'Personal Details', icon: '👤', description: 'Contact information' },
  { id: 'summary', label: 'Summary', icon: '📝', description: 'Professional summary' },
  { id: 'experience', label: 'Experience', icon: '💼', description: 'Work history' },
  { id: 'education', label: 'Education', icon: '🎓', description: 'Academic background' },
  { id: 'skills', label: 'Skills', icon: '⚡', description: 'Technical & soft skills' },
  { id: 'projects', label: 'Projects', icon: '🚀', description: 'Portfolio & side projects' },
  { id: 'certifications', label: 'Certifications', icon: '🏆', description: 'Professional credentials' },
];

const DEFAULT_ORDER = ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

function SortableSection({ section }: { section: SectionItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white">
      <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-slate-400" />
        </button>
        <div className="text-2xl">{section.icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{section.label}</h4>
          <p className="text-xs text-slate-500">{section.description}</p>
        </div>
      </div>
    </div>
  );
}

export function SectionReorder({ onClose }: SectionReorderProps) {
  const { sectionOrder, setSectionOrder } = useResumeStore();
  const [localOrder, setLocalOrder] = useState<string[]>(sectionOrder || DEFAULT_ORDER);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    setSectionOrder(localOrder);
    onClose();
  };

  const handleReset = () => {
    setLocalOrder(DEFAULT_ORDER);
  };

  const orderedSections = localOrder
    .map(id => SECTION_ITEMS.find(item => item.id === id))
    .filter(Boolean) as SectionItem[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <Card className="border-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Reorder Sections</h2>
              <p className="text-sm text-slate-600 mt-1">
                Drag and drop to change the order sections appear in your resume
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {orderedSections.map((section) => (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SortableSection section={section} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>

            {/* Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Most recruiters expect to see Experience and Education near the top. 
                Customize the order to highlight your strengths!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-slate-50">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Order
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}