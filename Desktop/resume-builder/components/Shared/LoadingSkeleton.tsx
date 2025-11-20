/**
 * Loading Skeleton Component
 * Beautiful loading states for better UX
 */

'use client';

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header Skeleton */}
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      
      {/* Content Skeleton */}
      <div className="space-y-3 mt-6">
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-24 bg-slate-200 rounded" />
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PreviewSkeleton() {
  return (
    <div className="bg-white p-12 animate-pulse space-y-6">
      {/* Name */}
      <div className="h-10 bg-slate-200 rounded w-2/3" />
      
      {/* Contact */}
      <div className="flex gap-4">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-4 bg-slate-200 rounded w-32" />
      </div>
      
      {/* Summary */}
      <div className="space-y-2 pt-4 border-t">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
      </div>
      
      {/* Experience */}
      <div className="space-y-4 pt-4 border-t">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2 pl-4 border-l-2 border-slate-200">
            <div className="h-5 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}