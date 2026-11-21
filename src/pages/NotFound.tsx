import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const location = useLocation();
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md mx-auto">
      <div className="text-6xl text-gray-100 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6">
        The page you're looking for ({location.pathname}) does not exist.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Back to Home
        </Link>
        <Link
          to="/items"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          View Items
        </Link>
      </div>
    </div>
  );
}
