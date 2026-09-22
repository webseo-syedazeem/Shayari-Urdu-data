import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ش</span>
              </div>
              <span className="text-xl font-bold">ShayariUrdu.com</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Discover the beauty of Urdu poetry and wisdom. Your gateway to timeless shayari,
              ghazals, nazms, and quotes from legendary poets across languages and generations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
             
              <li>
                <Link to="/privacy-policy" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/dmca-copyright" className="text-gray-300 hover:text-amber-400 transition-colors">
                  DMCA &amp; Copyright
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Connected</h3>
            <p className="text-gray-300 text-sm mb-4">
              Subscribe to our newsletter for daily shayari and updates.
            </p>
            <form className="mb-6">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2 rounded-l-lg border-0 text-gray-900 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-r-lg transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>

            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/shayariurduweb/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Follow ShayariUrdu.com on Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/shayariurduweb/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Follow ShayariUrdu.com on Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://x.com/shayariurduweb"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Follow ShayariUrdu.com on X"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} ShayariUrdu.com. All rights reserved. Made with love for Urdu poetry.</p>
        </div>
      </div>
    </footer>
  );
}
