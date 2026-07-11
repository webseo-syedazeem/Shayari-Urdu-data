import { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import ChatWidget from './components/ChatWidget';
import { getShayariUrl } from './utils/shayariUrl';
import { api } from './services/api';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

const pagePaths: Record<string, string> = {
  home: '/',
  explore: '/explore',
  poets: '/poets',
  topics: '/topics',
  tags: '/tags',
  collections: '/collections',
  search: '/search',
  games: '/games',
  ebooks: '/ebooks',
  dictionary: '/dictionary',
  about: '/about',
  admin: '/admin',
  'admin-login': '/admin-login',
};

const getCurrentPage = (pathname: string) => {
  const [, firstSegment] = pathname.split('/');

  if (!firstSegment) return 'home';
  if (firstSegment === 'admin-login') return 'admin-login';
  if (firstSegment === 'admin') return 'admin';

  return firstSegment;
};

function PoetRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { poetId } = useParams();
  return poetId ? <PoetDetailPage poetId={poetId} onNavigate={onNavigate} /> : <PoetsPage onNavigate={onNavigate} />;
}

function TopicRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { topicSlug } = useParams();
  return topicSlug ? <TopicDetailPage topicSlug={topicSlug} onNavigate={onNavigate} /> : <TopicsPage onNavigate={onNavigate} />;
}

function TagRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { tagSlug } = useParams();
  return tagSlug ? <TagDetailPage tagSlug={tagSlug} onNavigate={onNavigate} /> : <TagsPage onNavigate={onNavigate} />;
}

function CollectionRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { collectionId } = useParams();
  return collectionId ? <CollectionDetailPage collectionId={collectionId} onNavigate={onNavigate} /> : <CollectionsPage onNavigate={onNavigate} />;
}

function ShayariRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { slug } = useParams();
  return slug ? <ShayariDetailPage shayariSlug={slug} onNavigate={onNavigate} /> : <ExplorePage onNavigate={onNavigate} />;
}

function LegacyShayariRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { shayariId } = useParams();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [fallbackId, setFallbackId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function redirectLegacyUrl() {
      if (!shayariId) {
        setNotFound(true);
        return;
      }

      try {
        const shayari = await api.getShayariById(shayariId);
        const canonicalUrl = getShayariUrl(shayari);
        if (canonicalUrl === `/shayari/${shayariId}`) {
          setFallbackId(shayariId);
          return;
        }

        setRedirectTo(canonicalUrl);
      } catch (error) {
        console.error('Error redirecting legacy shayari URL:', error);
        setNotFound(true);
      }
    }

    redirectLegacyUrl();
  }, [shayariId]);

  if (redirectTo) return <Navigate to={redirectTo} replace />;
  if (fallbackId) return <ShayariDetailPage shayariId={fallbackId} onNavigate={onNavigate} />;
  if (notFound) return <Navigate to="/explore" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}

function EbookRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { ebookId } = useParams();
  return ebookId ? <EbookDetailPage ebookId={ebookId} onNavigate={onNavigate} /> : <EbooksPage onNavigate={onNavigate} />;
}

function DictionaryRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const [searchParams] = useSearchParams();
  return <DictionaryPage onNavigate={onNavigate} initialQuery={searchParams.get('query') || ''} />;
}

function DictionaryWordRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { wordId } = useParams();
  return wordId ? <DictionaryDetailPage wordId={wordId} onNavigate={onNavigate} /> : <DictionaryPage onNavigate={onNavigate} />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const currentPage = getCurrentPage(location.pathname);
  const isAdminPage = currentPage === 'admin-login' || currentPage === 'admin';

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('adminAccessToken');
        if (!token) {
          setIsAdminLoggedIn(false);
          localStorage.removeItem('adminLoggedIn');
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/auth/session`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setIsAdminLoggedIn(true);
          localStorage.setItem('adminLoggedIn', 'true');
        } else {
          setIsAdminLoggedIn(false);
          localStorage.removeItem('adminLoggedIn');
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsAdminLoggedIn(false);
        localStorage.removeItem('adminLoggedIn');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.search]);

  const handleNavigate = (page: string, id?: string) => {
    if (page === 'poet' && id) {
      navigate(`/poets/${id}`);
      return;
    }

    if (page === 'topic' && id) {
      navigate(`/topics/${id}`);
      return;
    }

    if (page === 'tag' && id) {
      navigate(`/tags/${id}`);
      return;
    }

    if (page === 'collection' && id) {
      navigate(`/collections/${id}`);
      return;
    }

    if (page === 'shayari' && id) {
      navigate(id.startsWith('/') ? id : `/shayari/${id}`);
      return;
    }

    if (page === 'ebook' && id) {
      navigate(`/ebooks/${id}`);
      return;
    }

    if (page === 'dictionary-word' && id) {
      navigate(`/dictionary/word/${id}`);
      return;
    }

    if (page === 'dictionary' && id) {
      navigate(`/dictionary?query=${encodeURIComponent(id)}`);
      return;
    }

    navigate(pagePaths[page] || '/');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate('/search');
  };

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    navigate('/admin');
  };

  const handleAdminLogout = async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    navigate('/');
  };

  const renderRoutes = () => {
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

    return (
      <Routes>
        <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
        <Route path="/explore" element={<ExplorePage onNavigate={handleNavigate} />} />
        <Route path="/poets" element={<PoetsPage onNavigate={handleNavigate} />} />
        <Route path="/poets/:poetId" element={<PoetRoute onNavigate={handleNavigate} />} />
        <Route path="/topics" element={<TopicsPage onNavigate={handleNavigate} />} />
        <Route path="/topics/:topicSlug" element={<TopicRoute onNavigate={handleNavigate} />} />
        <Route path="/tags" element={<TagsPage onNavigate={handleNavigate} />} />
        <Route path="/tags/:tagSlug" element={<TagRoute onNavigate={handleNavigate} />} />
        <Route path="/collections" element={<CollectionsPage onNavigate={handleNavigate} />} />
        <Route path="/collections/:collectionId" element={<CollectionRoute onNavigate={handleNavigate} />} />
        <Route path="/shayari/:shayariId" element={<LegacyShayariRoute onNavigate={handleNavigate} />} />
        <Route path="/:year/:month/:day/:slug" element={<ShayariRoute onNavigate={handleNavigate} />} />
        <Route path="/search" element={<SearchPage initialQuery={searchQuery} onNavigate={handleNavigate} />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/ebooks" element={<EbooksPage onNavigate={handleNavigate} />} />
        <Route path="/ebooks/:ebookId" element={<EbookRoute onNavigate={handleNavigate} />} />
        <Route path="/dictionary" element={<DictionaryRoute onNavigate={handleNavigate} />} />
        <Route path="/dictionary/word/:wordId" element={<DictionaryWordRoute onNavigate={handleNavigate} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin-login" element={<AdminLoginPage onLogin={handleAdminLogin} />} />
        <Route
          path="/admin"
          element={
            isAdminLoggedIn ? (
              <AdminDashboard onLogout={handleAdminLogout} onNavigate={handleNavigate} />
            ) : (
              <AdminLoginPage onLogin={handleAdminLogin} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {renderRoutes()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors">
      <Header currentPage={currentPage} onNavigate={handleNavigate} onSearch={handleSearch} />
      <AdSlot placement="header" pageScope="global" />
      <main className="flex-1">{renderRoutes()}</main>
      <AdSlot placement="footer" pageScope="global" />
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default App;
