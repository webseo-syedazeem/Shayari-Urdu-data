import { useState, useEffect, useRef } from 'react';
import { Search, User, Bookmark, Menu, X, Moon, Sun, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSearch?: (query: string) => void;
}

export default function Header({ currentPage, onNavigate, onSearch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [exploreDropdownOpen, setExploreDropdownOpen] = useState(false);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const exploreLinks = [
    { name: 'Shayari', page: 'explore' },
    { name: 'Poets', page: 'poets' },
    { name: 'Topics', page: 'topics' },
    { name: 'Tags', page: 'tags' },
    { name: 'Collections', page: 'collections' },
  ];

  const mainNavLinks = [
    { name: 'Games', page: 'games' },
    { name: 'Ebooks', page: 'ebooks' },
    { name: 'Dictionary', page: 'dictionary' },
    { name: 'About', page: 'about' },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      setDarkMode(isDark);
      applyTheme(isDark);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      applyTheme(prefersDark);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExploreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    applyTheme(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      onNavigate('search');
    }
  };

  const isExploreActive = exploreLinks.some(link => link.page === currentPage);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 shadow-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 lg:space-x-6">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 group flex-shrink-0"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ش</span>
                </div>
                <span className="hidden sm:block text-xl font-bold text-slate-700 dark:text-neutral-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  ShayariUrdu.com
                </span>
              </button>

              <nav className="hidden lg:flex items-center space-x-1">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setExploreDropdownOpen(!exploreDropdownOpen)}
                    onMouseEnter={() => setExploreDropdownOpen(true)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-1 ${
                      isExploreActive
                        ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>Explore</span>
                    <ChevronDown size={16} className={`transition-transform ${exploreDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {exploreDropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 py-1"
                      onMouseLeave={() => setExploreDropdownOpen(false)}
                    >
                      {exploreLinks.map((link) => (
                        <button
                          key={link.page}
                          onClick={() => {
                            onNavigate(link.page);
                            setExploreDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                            currentPage === link.page
                              ? 'bg-slate-100 dark:bg-neutral-700 text-slate-900 dark:text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {link.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {mainNavLinks.map((link) => (
                  <button
                    key={link.page}
                    onClick={() => onNavigate(link.page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      currentPage === link.page
                        ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-3">
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 lg:w-48 pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                </div>
              </form>

              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  aria-label="Toggle dark mode"
                  title="Toggle dark mode"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button
                  onClick={() => setBookmarkModalOpen(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  aria-label="Saved shayari"
                  title="Saved shayari (Coming soon)"
                >
                  <Bookmark size={20} />
                </button>

                <button
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  aria-label="Sign in"
                  title="Sign in / Register (Coming soon)"
                >
                  <User size={20} />
                </button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200 dark:border-neutral-700">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                </div>
              </form>

              <nav className="space-y-2">
                <button
                  onClick={() => {
                    onNavigate('home');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'home'
                      ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  Home
                </button>

                <div className="border-t border-gray-200 dark:border-neutral-700 pt-2 mt-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Explore
                  </div>
                  {exploreLinks.map((link) => (
                    <button
                      key={link.page}
                      onClick={() => {
                        onNavigate(link.page);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === link.page
                          ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {link.name}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-neutral-700 pt-2 mt-2">
                  {mainNavLinks.map((link) => (
                    <button
                      key={link.page}
                      onClick={() => {
                        onNavigate(link.page);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === link.page
                          ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {link.name}
                    </button>
                  ))}
                </div>
              </nav>

              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
                <button
                  onClick={toggleDarkMode}
                  className="flex-1 p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center"
                  title="Toggle dark mode"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setBookmarkModalOpen(true)}
                  className="flex-1 p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center"
                  title="Saved shayari"
                >
                  <Bookmark size={20} />
                </button>
                <button
                  className="flex-1 p-2 text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center"
                  title="Sign in"
                >
                  <User size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {bookmarkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4" onClick={() => setBookmarkModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-slate-100 dark:bg-neutral-700 rounded-lg">
                <Bookmark className="text-slate-700 dark:text-neutral-300" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Saved Shayari</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Save your favorite shayari to read later. This feature is coming soon!
            </p>
            <button
              onClick={() => setBookmarkModalOpen(false)}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
