import { Gamepad2, User, BookText, Lightbulb } from 'lucide-react';

export default function GamesPage() {
  const comingGames = [
    {
      id: '1',
      title: 'Guess the Poet',
      description: 'Read a couplet and identify which legendary poet wrote it. Test your knowledge of Urdu poetry masters!',
      icon: User,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: '2',
      title: 'Complete the Sher',
      description: 'Fill in the missing words from famous shayari. Challenge your memory of beloved verses.',
      icon: BookText,
      color: 'from-amber-500 to-amber-600',
    },
    {
      id: '3',
      title: 'Poetry Quiz',
      description: 'Answer trivia questions about poets, their works, and the rich history of Urdu literature.',
      icon: Lightbulb,
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-6">
              <Gamepad2 size={40} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Poetry & Word Games</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Fun and engaging games to test your knowledge of Urdu poetry and expand your literary horizons
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 md:p-12 text-center mb-12 border border-amber-100">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're working hard to bring you exciting poetry games that will make learning and enjoying
            Urdu literature even more fun. Stay tuned!
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Planned Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comingGames.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-lg flex items-center justify-center mb-4`}>
                  <game.icon className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{game.title}</h3>
                <p className="text-gray-600 leading-relaxed">{game.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Want to Suggest a Game?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Have an idea for a fun poetry game? We'd love to hear from you! Help us create
            engaging experiences for poetry lovers.
          </p>
          <button className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg">
            Share Your Ideas
          </button>
        </div>
      </div>
    </div>
  );
}
