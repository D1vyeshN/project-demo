import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-700">
            <span>📦</span> HisaabKitaab
          </Link>
        </div>

        <div className="hidden md:flex-1 md:flex items-center max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600 relative">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
              A
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">admin@hisaabkitaab.com</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
