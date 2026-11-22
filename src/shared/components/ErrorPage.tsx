import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { AlertTriangle } from 'lucide-react';

type ErrorPageProps = {
  status: number;
  title: string;
  description: string;
};

export function ErrorPage({ status, title, description }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-6xl font-mono text-gray-900 mb-2">
            {status}
          </CardTitle>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
        <AlertTriangle className="w-3 h-3" />
        <span>Error {status}</span>
      </div>
    </div>
  );
}
