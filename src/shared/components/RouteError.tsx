import { useRouteError } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { AlertTriangle } from 'lucide-react';
export function RouteError() {
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred.';

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      <Button
        asChild
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        <a>Back to Home</a>
      </Button>
    </div>
  );
}
