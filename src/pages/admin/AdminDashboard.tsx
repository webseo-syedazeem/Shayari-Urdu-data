import { useState } from 'react';
import { BookOpen, Users, Tag, FolderOpen, Book, FileText, DollarSign, LogOut, Home, Hash, Download } from 'lucide-react';
import ManageShayariPage from './ManageShayariPage';
import ManagePoetsPage from './ManagePoetsPage';
import ManageTopicsPage from './ManageTopicsPage';
import ManageTagsPage from './ManageTagsPage';
import ManageCollectionsPage from './ManageCollectionsPage';
import ManageEbooksPage from './ManageEbooksPage';
import ManageDictionaryPage from './ManageDictionaryPage';
import ManageAdSlotsPage from './ManageAdSlotsPage';
import WordPressImportPage from './WordPressImportPage';
import AdminErrorBoundary from '../../components/admin/AdminErrorBoundary';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

type AdminSection = 'overview' | 'shayari' | 'poets' | 'topics' | 'tags' | 'collections' | 'ebooks' | 'dictionary' | 'ads' | 'wordpress';

export default function AdminDashboard({ onLogout, onNavigate }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const menuItems = [
    { id: 'shayari' as const, label: 'Manage Shayari', icon: BookOpen },
    { id: 'poets' as const, label: 'Manage Poets', icon: Users },
    { id: 'topics' as const, label: 'Manage Topics', icon: Tag },
    { id: 'tags' as const, label: 'Manage Tags', icon: Hash },
    { id: 'collections' as const, label: 'Manage Collections', icon: FolderOpen },
    { id: 'ebooks' as const, label: 'Manage Ebooks', icon: Book },
    { id: 'dictionary' as const, label: 'Manage Dictionary', icon: FileText },
    { id: 'ads' as const, label: 'Manage Ad Slots', icon: DollarSign },
    { id: 'wordpress' as const, label: 'WordPress Import', icon: Download },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    onLogout();
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'shayari':
        return (
          <AdminErrorBoundary key="shayari">
            <ManageShayariPage />
          </AdminErrorBoundary>
        );
      case 'poets':
        return (
          <AdminErrorBoundary key="poets">
            <ManagePoetsPage />
          </AdminErrorBoundary>
        );
      case 'topics':
        return (
          <AdminErrorBoundary key="topics">
            <ManageTopicsPage />
          </AdminErrorBoundary>
        );
      case 'tags':
        return (
          <AdminErrorBoundary key="tags">
            <ManageTagsPage />
          </AdminErrorBoundary>
        );
      case 'collections':
        return (
          <AdminErrorBoundary key="collections">
            <ManageCollectionsPage />
          </AdminErrorBoundary>
        );
      case 'ebooks':
        return (
          <AdminErrorBoundary key="ebooks">
            <ManageEbooksPage />
          </AdminErrorBoundary>
        );
      case 'dictionary':
        return (
          <AdminErrorBoundary key="dictionary">
            <ManageDictionaryPage />
          </AdminErrorBoundary>
        );
      case 'ads':
        return (
          <AdminErrorBoundary key="ads">
            <ManageAdSlotsPage />
          </AdminErrorBoundary>
        );
      case 'wordpress':
        return (
          <AdminErrorBoundary key="wordpress">
            <WordPressImportPage onNavigate={onNavigate} />
          </AdminErrorBoundary>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to ShayariUrdu Admin Panel
            </h2>
            <p className="text-gray-600 mb-8">
              Select a section from the menu to manage your content
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="p-6 bg-white rounded-lg border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all"
                >
                  <item.icon size={32} className="mx-auto mb-3 text-amber-600" />
                  <p className="font-medium text-gray-900">{item.label}</p>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">ShayariUrdu Admin</h1>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'overview'
                ? 'bg-amber-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <Home size={20} />
            <span>Overview</span>
          </button>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeSection === item.id
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-300 hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => onNavigate('home')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-gray-300 hover:bg-slate-800 transition-colors"
          >
            <Home size={20} />
            <span>Back to Site</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
