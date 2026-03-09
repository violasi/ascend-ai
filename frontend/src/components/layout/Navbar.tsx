import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <span className="text-2xl">🎯</span>
            <span>SWE Prep</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Jobs
            </Link>
            <Link href="/companies" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Companies
            </Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              API
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
