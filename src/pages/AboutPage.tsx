import { Heart, Users, BookOpen, Globe } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Vast Collection',
      description: 'Access thousands of shayari, ghazals, nazms, and quotes from legendary poets across languages.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with poetry lovers, share your favorites, and discover new gems through our community.',
    },
    {
      icon: Globe,
      title: 'Multi-Language',
      description: 'Experience poetry in Urdu, Roman Urdu, Hindi, and English with seamless language switching.',
    },
    {
      icon: Heart,
      title: 'Curated Collections',
      description: 'Explore handpicked collections organized by themes, moods, and occasions for every moment.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About ShayariUrdu.com</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Your gateway to the timeless beauty of Urdu poetry and wisdom
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            ShayariUrdu.com is dedicated to preserving and promoting the rich heritage of Urdu poetry and
            making it accessible to poetry lovers around the world. We believe that great poetry transcends
            language barriers and speaks directly to the human soul.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our platform brings together the works of legendary poets like Mirza Ghalib, Allama Iqbal,
            Faiz Ahmad Faiz, and many others, making their timeless verses available in multiple languages
            and formats. Whether you are a lifelong devotee of Urdu literature or just discovering its beauty,
            we invite you to explore, enjoy, and share the magic of shayari.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Be part of a growing community of poetry enthusiasts. Discover, save, and share the verses
            that move your heart. Together, let us keep the tradition of Urdu poetry alive.
          </p>
          <button className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg">
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
