import { useState, useEffect } from 'react';
import { Download, BookOpen, FileText, User } from 'lucide-react';
import { Seo, generateEbookSeo } from '../components/seo/Seo';
import { api, Ebook } from '../services/api';

interface EbookDetailPageProps {
  ebookId: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function EbookDetailPage({ ebookId, onNavigate }: EbookDetailPageProps) {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEbook() {
      console.log('EbookDetailPage - Loading ebook with ID:', ebookId);

      try {
        setLoading(true);
        setError(null);

        const ebookRes = await api.getEbookById(ebookId);
        console.log('EbookDetailPage - Loaded ebook:', ebookRes);

        if (!ebookRes) {
          setError('Ebook not found');
          setEbook(null);
        } else {
          setEbook(ebookRes);
        }
      } catch (err: any) {
        console.error('EbookDetailPage - Error loading ebook:', err);
        setError(err?.message || 'Failed to load ebook');
        setEbook(null);
      } finally {
        setLoading(false);
      }
    }

    if (ebookId) {
      loadEbook();
    } else {
      setError('No ebook ID provided');
      setLoading(false);
    }
  }, [ebookId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ebook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Ebook</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onNavigate('ebooks')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Back to Ebooks
          </button>
        </div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ebook Not Found</h2>
          <p className="text-gray-600 mb-6">The ebook you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => onNavigate('ebooks')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Back to Ebooks
          </button>
        </div>
      </div>
    );
  }

  const title = ebook.titles?.roman_urdu || ebook.titles?.urdu || ebook.titles?.english || 'Untitled';
  const description = ebook.descriptions?.roman_urdu || ebook.descriptions?.english || ebook.descriptions?.urdu || '';
  const seoData = generateEbookSeo(ebook);

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        ogImage={seoData.ogImage}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => onNavigate('ebooks')}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center space-x-2"
        >
          <span>← Back to Ebooks</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gradient-to-br from-slate-100 to-slate-50 p-8 flex items-center justify-center">
              <img
                src={ebook.cover_image || 'https://images.pexels.com/photos/256559/pexels-photo-256559.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={title}
                className="w-full max-w-xs rounded-lg shadow-lg"
              />
            </div>

            <div className="md:w-2/3 p-8 md:p-12">
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {title}
                </h1>

                {ebook.poet_name && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-gray-500" />
                      <p className="text-lg font-semibold text-gray-900">{ebook.poet_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 mb-6 text-gray-600">
                  {ebook.pages > 0 && (
                    <div className="flex items-center space-x-2">
                      <BookOpen size={18} />
                      <span>{ebook.pages} pages</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <FileText size={18} />
                    <span>Urdu</span>
                  </div>
                </div>

                {description && (
                  <p className="text-gray-700 leading-relaxed mb-8">
                    {description}
                  </p>
                )}

                {(ebook.file_url_pdf || ebook.file_url_epub) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">Download Options</h3>
                    <div className="flex flex-wrap gap-3">
                      {ebook.file_url_pdf && (
                        <a
                          href={ebook.file_url_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                        >
                          <Download size={20} />
                          <span>Download PDF</span>
                        </a>
                      )}
                      {ebook.file_url_epub && (
                        <a
                          href={ebook.file_url_epub}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors"
                        >
                          <Download size={20} />
                          <span>Download EPUB</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
