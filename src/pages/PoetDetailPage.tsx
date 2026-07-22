import { useState, useEffect } from 'react';
import { MapPin, Calendar, BookOpen } from 'lucide-react';
import ShayariCard from '../components/ShayariCard';
import EbookCard from '../components/EbookCard';
import { Seo, generatePoetSeo } from '../components/seo/Seo';
import { api, Poet, Shayari, Ebook } from '../services/api';
import { getShayariUrl } from '../utils/shayariUrl';

const FALLBACK_AVATAR = '/images/poet-image-not-found.svg';

interface PoetDetailPageProps {
  poetSlug: string;
  onNavigate: (page: string, id?: string) => void;
}

const PAGE_SIZE = 52;

function readInitialPage() {
  const page = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function PoetDetailPage({ poetSlug, onNavigate }: PoetDetailPageProps) {
  const [poet, setPoet] = useState<Poet | null>(null);
  const [poetShayari, setPoetShayari] = useState<Shayari[]>([]);
  const [poetEbooks, setPoetEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'ghazals' | 'nazms' | 'sher' | 'qitta' | 'ebooks'>('all');
  const [currentPage, setCurrentPage] = useState(readInitialPage);

  useEffect(() => {
    async function loadPoetData() {
      try {
        setLoading(true);
        const poetRes = await api.getPoet(poetSlug);
        const [shayariRes, ebooksRes] = await Promise.all([
          api.getShayari({ poetId: poetRes.id, pageSize: 1000 }),
          api.getEbooks({ poetId: poetRes.id, pageSize: 20 })
        ]);

        setPoet(poetRes);
        setPoetShayari(shayariRes.data);
        setPoetEbooks(ebooksRes.data);
      } catch (error) {
        console.error('Error loading poet data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPoetData();
  }, [poetSlug]);

  useEffect(() => {
    setCurrentPage(readInitialPage());
  }, [poetSlug]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('page', String(currentPage));
    window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}`);
  }, [currentPage, poetSlug]);

  const popularShayari = [...poetShayari].sort((a, b) => b.popularity_score - a.popularity_score);
  const ghazals = poetShayari.filter((s) => s.form?.toLowerCase() === 'ghazal');
  const nazms = poetShayari.filter((s) => s.form?.toLowerCase() === 'nazm');
  const sher = poetShayari.filter((s) => s.form?.toLowerCase() === 'sher');
  const qitta = poetShayari.filter((s) => s.form?.toLowerCase() === 'qitta');

  const getDisplayShayari = () => {
    switch (activeTab) {
      case 'popular': return popularShayari;
      case 'ghazals': return ghazals;
      case 'nazms': return nazms;
      case 'sher': return sher;
      case 'qitta': return qitta;
      default: return poetShayari;
    }
  };

  const displayShayari = getDisplayShayari();
  const totalPages = Math.ceil(displayShayari.length / PAGE_SIZE);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!poet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Poet Not Found</h2>
          <button
            onClick={() => onNavigate('poets')}
            className="text-slate-700 hover:text-slate-900 font-medium"
          >
            Back to Poets
          </button>
        </div>
      </div>
    );
  }

  const startResult = displayShayari.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endResult = Math.min(currentPage * PAGE_SIZE, displayShayari.length);
  const paginatedShayari = displayShayari.slice(startResult - 1, endResult);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => Math.abs(pageNumber - currentPage) <= 2);

  function updatePage(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateTab(tab: typeof activeTab) {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  const seoData = generatePoetSeo(poet);

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        ogImage={seoData.ogImage}
        ogType="article"
      />
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <img
              src={poet.avatar_url || FALLBACK_AVATAR}
              alt={poet.avatar_url ? poet.name : `${poet.name} image not available`}
              className="w-40 h-40 rounded-full object-cover border-4 border-white/20"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith(FALLBACK_AVATAR)) {
                  event.currentTarget.src = FALLBACK_AVATAR;
                }
              }}
            />

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{poet.name}</h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-gray-300">
                {(poet.birth_year || poet.death_year) && (
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} />
                    <span>
                      {poet.birth_year || '?'} - {poet.death_year || 'Present'}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPin size={18} />
                  <span>{poet.country}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen size={18} />
                  <span>{poetShayari.length} works</span>
                </div>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed max-w-3xl">
                {poet.long_bio || poet.short_bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-8 border border-gray-200 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              { id: 'all', label: 'All Shayari', count: poetShayari.length },
              { id: 'popular', label: 'Popular', count: popularShayari.length },
              { id: 'ghazals', label: 'Ghazals', count: ghazals.length },
              { id: 'nazms', label: 'Nazms', count: nazms.length },
              { id: 'sher', label: 'Sher', count: sher.length },
              { id: 'qitta', label: 'Qitta', count: qitta.length },
              { id: 'ebooks', label: 'Ebooks', count: poetEbooks.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => updateTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-sm opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'ebooks' ? (
          poetEbooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {poetEbooks.map((ebook) => (
                <EbookCard
                  key={ebook.id}
                  ebook={ebook}
                  onClick={() => onNavigate('ebook', ebook.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Ebooks</h3>
              <p className="text-gray-600">No ebooks available for this poet yet</p>
            </div>
          )
        ) : (
          displayShayari.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedShayari.map((shayari) => (
                <ShayariCard
                  key={shayari.id}
                  shayari={shayari}
                  onClick={() => onNavigate('shayari', getShayariUrl(shayari))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results</h3>
              <p className="text-gray-600">No shayari found in this category</p>
            </div>
          )
        )}

        {activeTab !== 'ebooks' && totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing {startResult}-{endResult} of {displayShayari.length} results
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updatePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => updatePage(pageNumber)}
                  disabled={pageNumber === currentPage}
                  className={`min-w-10 px-3 py-2 rounded-lg border font-semibold transition-all disabled:cursor-not-allowed ${
                    pageNumber === currentPage
                      ? 'border-slate-700 bg-slate-700 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => updatePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
