import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

export function NotFound() {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-6xl font-mono text-gray-900 mb-2">404</CardTitle>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Page Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The page you're looking for ({location.pathname}) does not exist.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button
              asChild
              className="border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Link to="/items-stock">View Items</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
