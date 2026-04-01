import { useState, useRef, useEffect } from 'react';
import { Heart, Bookmark, Share2, Copy, Check, MessageCircle, BookOpen, X } from 'lucide-react';
import ShayariCard from '../components/ShayariCard';
import { api, Shayari } from '../services/api';

interface ShayariDetailPageProps {
  shayariId: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function ShayariDetailPage({ shayariId, onNavigate }: ShayariDetailPageProps) {
  const [shayari, setShayari] = useState<Shayari | null>(null);
  const [similarShayari, setSimilarShayari] = useState<Shayari[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [dictionaryWord, setDictionaryWord] = useState('');
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadShayari() {
      try {
        setLoading(true);
        const result = await api.getShayariById(shayariId);
        setShayari(result);

        if (result) {
          const similarRes = await api.getShayari({
            poetId: result.poet_id,
            pageSize: 4
          });
          setSimilarShayari(similarRes.data.filter(s => s.id !== shayariId).slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading shayari:', error);
      } finally {
        setLoading(false);
      }
    }

    loadShayari();
  }, [shayariId]);

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

  if (!shayari) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shayari Not Found</h2>
          <button
            onClick={() => onNavigate('explore')}
            className="text-slate-700 hover:text-slate-900 font-medium"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const currentVersion = shayari.shayari_language_versions?.[selectedVersionIdx];
  const poet = shayari.poets;

  const getCurrentText = () => {
    return currentVersion?.text || 'No text available';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDictionaryLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (dictionaryWord.trim()) {
      onNavigate('dictionary', dictionaryWord);
    }
  };

  const dummyComments = [
    {
      id: '1',
      author: 'Ahmad Khan',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
      text: 'Beautiful expression of emotions. This truly touches the heart.',
      time: '2 hours ago',
    },
    {
      id: '2',
      author: 'Ayesha Rahman',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
      text: 'One of my favorite pieces. The depth of meaning is incredible.',
      time: '5 hours ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {shayari.featured_image_url && (
            <div className="w-full h-64 md:h-96 overflow-hidden">
              <img
                src={shayari.featured_image_url}
                alt={shayari.featured_image_alt || 'Shayari featured image'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div
                ref={textContainerRef}
                className="text-2xl md:text-4xl leading-relaxed text-gray-900 font-serif mb-6 whitespace-pre-line"
              >
                {getCurrentText()}
              </div>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {shayari.shayari_language_versions?.map((version, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVersionIdx(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedVersionIdx === idx
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {version.language === 'roman' ? 'Roman Urdu' :
                   version.language.charAt(0).toUpperCase() + version.language.slice(1)}
                </button>
              ))}
            </div>

            {poet && (
              <button
                onClick={() => onNavigate('poet', poet.id)}
                className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <img
                  src={poet.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={poet.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="text-lg font-semibold text-gray-900">— {poet.name}</p>
                  <p className="text-sm text-gray-500">{poet.short_bio}</p>
                </div>
              </button>
            )}
          </div>

          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="flex justify-center">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                currentVersion?.language === 'roman' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                currentVersion?.language === 'urdu' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                currentVersion?.language === 'hindi' ? 'bg-green-100 text-green-700 border-green-200' :
                'bg-purple-100 text-purple-700 border-purple-200'
              }`}>
                {currentVersion?.language === 'roman' ? 'Roman Urdu' :
                 currentVersion?.language.charAt(0).toUpperCase() + currentVersion?.language.slice(1)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {shayari.form}
              </span>
              {shayari.is_trending && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  Trending
                </span>
              )}
              {shayari.is_featured && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                liked
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart size={20} className={liked ? 'fill-red-600' : ''} />
              <span>{shayari.popularity_score + (liked ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => setSaved(!saved)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                saved
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bookmark size={20} className={saved ? 'fill-amber-700' : ''} />
              <span>Save</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all">
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <form onSubmit={handleDictionaryLookup} className="flex items-center gap-2 w-full max-w-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Look up a word..."
                    value={dictionaryWord}
                    onChange={(e) => setDictionaryWord(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Dictionary
                </button>
              </form>
            </div>
          </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <MessageCircle size={24} />
            <span>Comments</span>
          </h2>

          <div className="space-y-6 mb-8">
            {dummyComments.map((c) => (
              <div key={c.id} className="flex space-x-4">
                <img
                  src={c.avatar}
                  alt={c.author}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{c.author}</h4>
                    <span className="text-sm text-gray-500">{c.time}</span>
                  </div>
                  <p className="text-gray-700">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add a Comment</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this shayari..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
            />
            <button className="mt-4 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors">
              Post Comment
            </button>
          </div>
        </div>

        {similarShayari.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Like This</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarShayari.map((s) => (
                <ShayariCard
                  key={s.id}
                  shayari={s}
                  onClick={() => onNavigate('shayari', s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
