import { useState, useEffect } from 'react';
import TagCard from '../components/TagCard';
import { api, Tag } from '../services/api';

interface TagsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

type TagsParams = {
  page: number;
  pageSize: number;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 52;

function readInitialParams(): TagsParams {
  const searchParams = new URLSearchParams(window.location.search);
  const pageParam = Number(searchParams.get('page'));

  return {
    page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
    pageSize: PAGE_SIZE,
  };
}

function syncParamsToURL(params: TagsParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));

  const nextUrl = `${window.location.pathname}?${searchParams.toString()}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, '', nextUrl);
  }
}

export default function TagsPage({ onNavigate }: TagsPageProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [params, setParams] = useState<TagsParams>(readInitialParams);

  useEffect(() => {
    let cancelled = false;

    async function loadTags() {
      try {
        syncParamsToURL(params);
        setLoading(true);
        setTags([]);
        setPagination(null);

        const result = await api.getTags({
          page: params.page,
          pageSize: params.pageSize,
        });

        if (!cancelled) {
          if (result.pagination.totalPages > 0 && params.page > result.pagination.totalPages) {
            setParams((prev) => ({ ...prev, page: result.pagination.totalPages }));
            return;
          }

          setTags(result.data);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!cancelled) console.error('Error loading tags:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTags();
    return () => {
      cancelled = true;
    };
  }, [params]);

  function updatePage(newPage: number) {
    if (pagination && (newPage < 1 || newPage > pagination.totalPages)) return;

    setParams((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const totalResults = pagination?.total || 0;
  const startResult = totalResults === 0 ? 0 : Math.min((params.page - 1) * params.pageSize + 1, totalResults);
  const endResult = pagination ? Math.min(params.page * params.pageSize, pagination.total) : 0;
  const pageNumbers = pagination
    ? Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
        .filter((pageNumber) => Math.abs(pageNumber - params.page) <= 2)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse by Tag</h1>
          <p className="text-lg text-gray-300">
            Explore shayari organized by popular tags and themes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            {loading
              ? 'Loading results...'
              : `Showing ${startResult}-${endResult} of ${totalResults} tags`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-gray-100"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-100"></div>
                  <div className="h-4 w-full rounded bg-gray-100"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                onClick={() => onNavigate('tag', tag.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
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
    </div>
  );
}