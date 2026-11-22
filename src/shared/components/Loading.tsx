import { Loader2 } from 'lucide-react';

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Loading...</span>
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse rounded-md bg-gray-100',
        className,
      ].filter(Boolean).join(' ')}
    />
  );
}
