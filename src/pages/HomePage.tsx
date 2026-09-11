import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import ShayariCard from '../components/ShayariCard';
import PoetCard from '../components/PoetCard';
import TopicCard from '../components/TopicCard';
import CollectionCard from '../components/CollectionCard';
import Carousel from '../components/Carousel';
import { PoetryOfTheDay } from '../components/PoetryOfTheDay';
import { AdSlot } from '../components/ads/AdSlot';
import { Seo } from '../components/seo/Seo';
import { api, Shayari, Poet, Topic, Collection } from '../services/api';
import { getShayariUrl } from '../utils/shayariUrl';

interface HomePageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [featuredShayari, setFeaturedShayari] = useState<Shayari[]>([]);
  const [poetryOfTheDay, setPoetryOfTheDay] = useState<Shayari[]>([]);
  const [trendingShayari, setTrendingShayari] = useState<Shayari[]>([]);
  const [mostLovedShayari, setMostLovedShayari] = useState<Shayari[]>([]);
  const [topPoets, setTopPoets] = useState<Poet[]>([]);
  const [topTopics, setTopTopics] = useState<Topic[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [shayariRes, poetryOfTheDayRes, poetsRes, topicsRes, collectionsRes] = await Promise.all([
          api.getShayari({ pageSize: 20 }),
          api.getPoetryOfTheDay({ pageSize: 10 }),
          api.getPoets({ pageSize: 6 }),
          api.getTopics(),
          api.getCollections({ pageSize: 3 })
        ]);

        setFeaturedShayari(shayariRes.data.filter(s => s.is_featured).slice(0, 3));
        setPoetryOfTheDay(poetryOfTheDayRes.data);
        setTrendingShayari(shayariRes.data.filter(s => s.is_trending).slice(0, 6));
        setMostLovedShayari(shayariRes.data.sort((a, b) => b.popularity_score - a.popularity_score).slice(0, 6));
        setTopPoets(poetsRes.data);
        setTopTopics(topicsRes.data.slice(0, 6));
        setFeaturedCollections(collectionsRes.data.filter(c => c.is_featured).slice(0, 3));
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 dark:border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      <Seo
        title="ShayariUrdu.com – Urdu, Roman Urdu, Hindi & English Shayari"
        description="Discover beautiful Urdu, Roman Urdu, Hindi and English shayari, ghazals, nazms and poetry quotes by your favorite poets. Browse by topics, moods, and collections."
        keywords="urdu shayari, roman urdu shayari, hindi shayari, poetry, quotes, ghazal, nazm, sher"
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-amber-600/20 px-4 py-2 rounded-full mb-6">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Discover Timeless Poetry</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Discover Timeless
                <span className="block text-amber-400">Shayari & Quotes</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                Browse ghazals, nazms, sher and quotes by your favorite poets, topics and moods.
                Experience the beauty of Urdu, Roman Urdu, Hindi & English poetry.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <span>Start Reading</span>
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => onNavigate('poets')}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-white/40"
                >
                  Browse by Poet
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-1 gap-4">
                {featuredShayari.map((shayari) => {
                  const firstVersion = shayari.shayari_language_versions?.[0];
                  return (
                    <div
                      key={shayari.id}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                      onClick={() => onNavigate('shayari', getShayariUrl(shayari))}
                    >
                      <p className="text-lg leading-relaxed mb-3 font-serif line-clamp-2">
                        {firstVersion?.text || 'No text available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-300 font-medium">
                          — {shayari.poets?.name || 'Unknown'}
                        </span>
                        <span className="px-2 py-1 bg-amber-600/30 text-amber-200 rounded text-xs">
                          {firstVersion?.language === 'roman' ? 'Roman Urdu' : firstVersion?.language}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdSlot placement="home_hero_top" pageScope="home" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PoetryOfTheDay
          items={poetryOfTheDay}
          onSelect={(shayari) => onNavigate('shayari', getShayariUrl(shayari))}
        />

        <section className="mb-16">
          <Carousel title="Trending Shayari Today">
            {trendingShayari.map((shayari) => (
              <div key={shayari.id} className="w-80 flex-shrink-0">
                <ShayariCard
                  shayari={shayari}
                  onClick={() => onNavigate('shayari', getShayariUrl(shayari))}
                />
              </div>
            ))}
          </Carousel>
        </section>

        <section className="mb-16">
          <Carousel title="Most Loved This Week">
            {mostLovedShayari.map((shayari) => (
              <div key={shayari.id} className="w-80 flex-shrink-0">
                <ShayariCard
                  shayari={shayari}
                  onClick={() => onNavigate('shayari', getShayariUrl(shayari))}
                  showStar={true}
                />
              </div>
            ))}
          </Carousel>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Explore by Poet
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Discover works from legendary poets</p>
            </div>
            <button
              onClick={() => onNavigate('poets')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-neutral-600 dark:hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topPoets.map((poet) => (
              <PoetCard
                key={poet.id}
                poet={poet}
                onClick={() => onNavigate('poet', poet.slug)}
              />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Browse by Topic
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Find shayari that speaks to your mood</p>
            </div>
            <button
              onClick={() => onNavigate('topics')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-neutral-600 dark:hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onClick={() => onNavigate('topic', topic.id)}
              />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Curated Collections
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Handpicked shayari for every occasion</p>
            </div>
            <button
              onClick={() => onNavigate('collections')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-neutral-600 dark:hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onClick={() => onNavigate('collection', collection.id)}
              />
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <TrendingUp size={48} className="mx-auto mb-6 text-amber-400" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Community
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover, save, and share your favorite shayari. Connect with poetry lovers
            from around the world and explore thousands of beautiful verses.
          </p>
          <button className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg">
            Get Started Today
          </button>
        </section>
      </div>
    </div>
  );
}
