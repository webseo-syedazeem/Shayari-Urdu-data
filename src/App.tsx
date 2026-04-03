import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { AdSlot } from './components/ads/AdSlot';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PoetsPage from './pages/PoetsPage';
import PoetDetailPage from './pages/PoetDetailPage';
import TopicsPage from './pages/TopicsPage';
import TopicDetailPage from './pages/TopicDetailPage';
import TagsPage from './pages/TagsPage';
import TagDetailPage from './pages/TagDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import ShayariDetailPage from './pages/ShayariDetailPage';
import SearchPage from './pages/SearchPage';
import GamesPage from './pages/GamesPage';
import EbooksPage from './pages/EbooksPage';
import EbookDetailPage from './pages/EbookDetailPage';
import DictionaryPage from './pages/DictionaryPage';
import DictionaryDetailPage from './pages/DictionaryDetailPage';
import AboutPage from './pages/AboutPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { isUsingSupabaseFallback, supabase } from './lib/supabase';

interface RouteState {
  page: string;
  id?: string;
}

function App() {
  const [route, setRoute] = useState<RouteState>({ page: 'home' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAdminLoggedIn(true);
          localStorage.setItem('adminLoggedIn', 'true');
        } else {
          setIsAdminLoggedIn(false);
          localStorage.removeItem('adminLoggedIn');
        }
      } catch (error) {
        console.error('Error checking Supabase session:', error);
        setIsAdminLoggedIn(false);
        localStorage.removeItem('adminLoggedIn');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAdminLoggedIn(true);
        localStorage.setItem('adminLoggedIn', 'true');
      } else {
        setIsAdminLoggedIn(false);
        localStorage.removeItem('adminLoggedIn');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'admin-login') {
        setRoute({ page: 'admin-login' });
      } else if (hash === 'admin') {
        setRoute({ page: 'admin' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  const handleNavigate = (page: string, id?: string) => {
    setRoute({ page, id });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setRoute({ page: 'admin' });
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    setRoute({ page: 'home' });
  };

  const renderPage = () => {
    if (isCheckingAuth) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      );
    }

    if (route.page === 'admin-login') {
      return <AdminLoginPage onLogin={handleAdminLogin} />;
    }

    if (route.page === 'admin') {
      if (!isAdminLoggedIn) {
        return <AdminLoginPage onLogin={handleAdminLogin} />;
      }
      return <AdminDashboard onLogout={handleAdminLogout} onNavigate={handleNavigate} />;
    }

    switch (route.page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;

      case 'explore':
        return <ExplorePage onNavigate={handleNavigate} />;

      case 'poets':
        return <PoetsPage onNavigate={handleNavigate} />;

      case 'poet':
        return route.id ? (
          <PoetDetailPage poetId={route.id} onNavigate={handleNavigate} />
        ) : (
          <PoetsPage onNavigate={handleNavigate} />
        );

      case 'topics':
        return <TopicsPage onNavigate={handleNavigate} />;

      case 'topic':
        return route.id ? (
          <TopicDetailPage topicSlug={route.id} onNavigate={handleNavigate} />
        ) : (
          <TopicsPage onNavigate={handleNavigate} />
        );

      case 'tags':
        return <TagsPage onNavigate={handleNavigate} />;

      case 'tag':
        return route.id ? (
          <TagDetailPage tagSlug={route.id} onNavigate={handleNavigate} />
        ) : (
          <TagsPage onNavigate={handleNavigate} />
        );

      case 'collections':
        return <CollectionsPage onNavigate={handleNavigate} />;

      case 'collection':
        return route.id ? (
          <CollectionDetailPage collectionId={route.id} onNavigate={handleNavigate} />
        ) : (
          <CollectionsPage onNavigate={handleNavigate} />
        );

      case 'shayari':
        return route.id ? (
          <ShayariDetailPage shayariId={route.id} onNavigate={handleNavigate} />
        ) : (
          <ExplorePage onNavigate={handleNavigate} />
        );

      case 'search':
        return <SearchPage initialQuery={searchQuery} onNavigate={handleNavigate} />;

      case 'games':
        return <GamesPage />;

      case 'ebooks':
        return <EbooksPage onNavigate={handleNavigate} />;

      case 'ebook':
        return route.id ? (
          <EbookDetailPage ebookId={route.id} onNavigate={handleNavigate} />
        ) : (
          <EbooksPage onNavigate={handleNavigate} />
        );

      case 'dictionary':
        return <DictionaryPage onNavigate={handleNavigate} initialQuery={route.id || ''} />;

      case 'dictionary-word':
        return route.id ? (
          <DictionaryDetailPage wordId={route.id} onNavigate={handleNavigate} />
        ) : (
          <DictionaryPage onNavigate={handleNavigate} />
        );

      case 'about':
        return <AboutPage />;

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  if (route.page === 'admin-login' || route.page === 'admin') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors">
      {isUsingSupabaseFallback && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          Supabase env vars are missing or invalid. Using fallback client configuration.
        </div>
      )}
      <Header currentPage={route.page} onNavigate={handleNavigate} onSearch={handleSearch} />
      <AdSlot placement="header" pageScope="global" />
      <main className="flex-1">{renderPage()}</main>
      <AdSlot placement="footer" pageScope="global" />
      <Footer />
    </div>
  );
}

export default App;
