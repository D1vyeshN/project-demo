import { Search, Bell, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-input">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex-1 md:flex items-center max-w-[400px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md hover:bg-muted text-muted-foreground relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive border border-white"></span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
              A
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Admin</div>
              {/* <div className="text-xs text-muted-foreground">admin@hisabkitab.com</div> */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}