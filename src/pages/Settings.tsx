import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Company Name</h3>
                <p className="text-xs text-gray-500">HisaabKitaab Inventory</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-600 text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">GST Number</h3>
                <p className="text-xs text-gray-500">22AAAAA0000A1Z5</p>
              </div>
              <div className="text-right">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Currency</h3>
                <p className="text-xs text-gray-500">Indian Rupee (₹)</p>
              </div>
              <div className="text-right">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

