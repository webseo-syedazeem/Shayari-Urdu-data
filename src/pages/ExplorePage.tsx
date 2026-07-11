import { Fragment, useEffect, useState } from 'react';
import ShayariCard from '../components/ShayariCard';
import FilterBar, { FilterState } from '../components/FilterBar';
import { AdSlot } from '../components/ads/AdSlot';
import { api, Shayari } from '../services/api';
import { getShayariUrl } from '../utils/shayariUrl';

interface ExplorePageProps {
  onNavigate: (page: string, id?: string) => void;
}

const PAGE_SIZE = 52;

type ExploreParams = {
  page: number;
  pageSize: number;
  form: string | null;
  language: string | null;
  mood: string | null;
  length: string | null;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const languages = [
  { value: 'roman_urdu', label: 'Roman Urdu' },
  { value: 'urdu', label: 'Urdu' },
  { value: 'hindi', label: 'Hindi' },
];

function readInitialParams(): ExploreParams {
  const searchParams = new URLSearchParams(window.location.search);
  const pageParam = Number(searchParams.get('page'));

  return {
    page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
    pageSize: PAGE_SIZE,
    form: searchParams.get('form') || null,
    language: searchParams.get('language') || null,
    mood: searchParams.get('mood') || null,
    length: searchParams.get('length') || null,
  };
}

function syncParamsToURL(params: ExploreParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));

  if (params.form) searchParams.set('form', params.form);
  if (params.language) searchParams.set('language', params.language);
  if (params.mood) searchParams.set('mood', params.mood);
  if (params.length) searchParams.set('length', params.length);

  const nextUrl = `${window.location.pathname}?${searchParams.toString()}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, '', nextUrl);
  }
}

export default function ExplorePage({ onNavigate }: ExplorePageProps) {
  const [shayari, setShayari] = useState<Shayari[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [params, setParams] = useState<ExploreParams>(readInitialParams);

  useEffect(() => {
    let cancelled = false;

    async function loadShayari() {
      try {
        syncParamsToURL(params);
        setLoading(true);
        setShayari([]);
        setPagination(null);

        const result = await api.getShayari({
          page: params.page,
          pageSize: params.pageSize,
          form: params.form || undefined,
          language: params.language || undefined,
          mood: params.mood || undefined,
          length: params.length || undefined,
        });

        if (!cancelled) {
          if (result.pagination.totalPages > 0 && params.page > result.pagination.totalPages) {
            setParams((prev) => ({ ...prev, page: result.pagination.totalPages }));
            return;
          }

          setShayari(result.data);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading shayari:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadShayari();

    return () => {
      cancelled = true;
    };
  }, [params]);

  function updateFilter(key: keyof Omit<ExploreParams, 'page' | 'pageSize'>, value: string | boolean | null) {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function updatePage(newPage: number) {
    if (pagination && (newPage < 1 || newPage > pagination.totalPages)) return;

    setParams((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearAllFilters() {
    setParams((prev) => ({
      ...prev,
      page: 1,
      form: null,
      language: null,
      mood: null,
      length: null,
    }));
  }

  const hasActiveFilters = Boolean(params.form || params.language || params.mood || params.length);
  const totalResults = pagination?.total || 0;
  const startResult = totalResults === 0 ? 0 : Math.min((params.page - 1) * params.pageSize + 1, totalResults);
  const endResult = pagination ? Math.min(params.page * params.pageSize, pagination.total) : 0;
  const pageNumbers = pagination
    ? Array.from({ length: pagination.totalPages }, (_, index) => index + 1).filter((pageNumber) => Math.abs(pageNumber - params.page) <= 2)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Shayari</h1>
          <p className="text-lg text-gray-300">
            Browse through our collection of beautiful poetry across multiple languages
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => updateFilter('language', params.language === lang.value ? null : lang.value)}
                className={`px-6 py-4 rounded-lg font-semibold text-center transition-all ${
                  params.language === lang.value
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-12">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <FilterBar
                    onFilterChange={(filterState: FilterState) => {
                      setParams((prev) => ({
                        ...prev,
                        page: 1,
                        form: filterState.form && filterState.form !== 'all'
                          ? filterState.form
                          : null,
                        mood: filterState.mood && filterState.mood !== 'all'
                          ? filterState.mood
                          : null,
                        length: filterState.length && filterState.length !== 'all'
                          ? filterState.length
                          : null,
                      }));
                    }}
                  />
                </div>
                <div className="sm:w-48">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                {loading
                  ? 'Loading results...'
                  : `Showing ${startResult}-${endResult} of ${totalResults} results`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-lg bg-white border border-gray-200 shadow-sm">
                    <div className="h-32 rounded-t-lg bg-gray-100"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-4 w-2/3 rounded bg-gray-100"></div>
                      <div className="h-4 w-full rounded bg-gray-100"></div>
                      <div className="h-4 w-5/6 rounded bg-gray-100"></div>
                      <div className="h-8 w-24 rounded bg-gray-100"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : shayari.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {shayari.map((shayari, index) => (
                  <Fragment key={shayari.id}>
                    <ShayariCard
                      shayari={shayari}
                      onClick={() => onNavigate('shayari', getShayariUrl(shayari))}
                    />
                    {(index + 1) === 0 && (
                      <div key={`ad-${index}`} className="sm:col-span-2 lg:col-span-4">
                        <AdSlot placement="between_shayari_cards" pageScope="explore" index={index} />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-gray-400">📝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results</p>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {startResult}-{endResult} of {totalResults} results
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePage(params.page - 1)}
                    disabled={loading || params.page <= 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => updatePage(pageNumber)}
                      disabled={loading || pageNumber === params.page}
                      className={`min-w-10 px-3 py-2 rounded-lg border font-semibold transition-all disabled:cursor-not-allowed ${
                        pageNumber === params.page
                          ? 'border-slate-700 bg-slate-700 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => updatePage(params.page + 1)}
                    disabled={loading || params.page >= pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24">
              <AdSlot placement="sidebar" pageScope="explore" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
