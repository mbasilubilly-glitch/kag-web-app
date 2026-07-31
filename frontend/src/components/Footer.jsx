import { Link } from 'react-router-dom'

function WhatsAppIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.004 2.667c-7.363 0-13.333 5.97-13.333 13.333 0 2.353.615 4.65 1.784 6.671L2.667 29.333l6.83-1.79a13.27 13.27 0 0 0 6.507 1.657h.006c7.362 0 13.333-5.97 13.333-13.333 0-3.56-1.387-6.907-3.905-9.425a13.245 13.245 0 0 0-9.434-3.775Zm0 24.4h-.005a11.08 11.08 0 0 1-5.647-1.547l-.405-.24-4.053 1.063 1.082-3.951-.264-.406a11.05 11.05 0 0 1-1.694-5.886c0-6.115 4.976-11.09 11.093-11.09a11.02 11.02 0 0 1 7.844 3.253 11.02 11.02 0 0 1 3.246 7.846c-.003 6.115-4.979 11.09-11.097 11.09v-.132Zm6.083-8.307c-.334-.167-1.974-.974-2.28-1.086-.306-.111-.529-.167-.752.167-.223.334-.863 1.086-1.058 1.309-.195.223-.39.251-.724.084-.334-.167-1.409-.519-2.684-1.654-.992-.885-1.662-1.978-1.857-2.312-.195-.334-.021-.515.146-.682.15-.15.334-.39.5-.585.167-.195.223-.334.334-.557.111-.223.056-.418-.028-.585-.084-.167-.752-1.814-1.03-2.484-.271-.652-.546-.564-.752-.574l-.64-.012c-.223 0-.585.084-.891.418-.306.334-1.169 1.142-1.169 2.786 0 1.644 1.197 3.233 1.364 3.456.167.223 2.356 3.598 5.708 5.045.797.344 1.42.55 1.905.704.8.254 1.529.218 2.104.132.642-.096 1.974-.807 2.252-1.587.278-.78.278-1.448.195-1.587-.084-.14-.306-.223-.64-.39Z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-700 border-t-4 border-primary-300 dark:from-slate-900 dark:to-slate-900 dark:text-slate-300 dark:border-primary-800 transition-colors duration-300">
      <div className="pl-72 lg:pl-72">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="KAG Unity Church" className="w-10 h-10 rounded-lg object-cover bg-white shadow-lg" />
                <span className="text-xl font-bold text-gray-800 dark:text-white">KAG Unity Church</span>
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                Connecting our community through faith, worship, and spiritual growth.
              </p>
              <div className="flex gap-3 mt-4">
                <a href="https://www.facebook.com/KAGunity" target="_blank" rel="noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-blue-200 dark:bg-slate-700 flex items-center justify-center text-sm hover:bg-primary-400 hover:text-white transition cursor-pointer">📘</a>
                <a href="https://wa.me/254725812019" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-[#1ebe5a] transition cursor-pointer shadow-sm">
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
                <span className="w-8 h-8 rounded-full bg-blue-200 dark:bg-slate-700 flex items-center justify-center text-sm hover:bg-primary-400 hover:text-white transition cursor-pointer">📷</span>
                <span className="w-8 h-8 rounded-full bg-blue-200 dark:bg-slate-700 flex items-center justify-center text-sm hover:bg-primary-400 hover:text-white transition cursor-pointer">▶️</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary-700 dark:text-primary-300 flex items-center gap-2">
                <span>🔗</span>
                <span>Quick Links</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li><Link to="/live" className="hover:text-primary-600 transition flex items-center gap-2"><span>📡</span> Live</Link></li>
                <li><Link to="/sermons" className="hover:text-primary-600 transition flex items-center gap-2"><span>🎥</span> Sermons</Link></li>
                <li><Link to="/events" className="hover:text-primary-600 transition flex items-center gap-2"><span>📅</span> Events</Link></li>
                <li><Link to="/ministries" className="hover:text-primary-600 transition flex items-center gap-2"><span>🤝</span> Ministries</Link></li>
                <li><Link to="/contact" className="hover:text-primary-600 transition flex items-center gap-2"><span>📞</span> Contact Us</Link></li>
              </ul>
            </div>

            {/* Ministries */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary-700 dark:text-primary-300 flex items-center gap-2">
                <span>🤲</span>
                <span>Ministries</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li><Link to="/dream-centre" className="hover:text-primary-600 transition flex items-center gap-2"><span>🌟</span> Dream Centre</Link></li>
                <li><Link to="/campus" className="hover:text-primary-600 transition flex items-center gap-2"><span>📍</span> Campus</Link></li>
                <li><Link to="/ministries" className="hover:text-primary-600 transition flex items-center gap-2"><span>👥</span> Youth Ministry</Link></li>
                <li><Link to="/worship" className="hover:text-primary-600 transition flex items-center gap-2"><span>🎤</span> Worship Team</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary-700 dark:text-primary-300 flex items-center gap-2">
                <span>📬</span>
                <span>Contact</span>
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">📍</span>
                  <span>Thika Road, Toll Weighbridge</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">📞</span>
                  <span>+254 725 812 019</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">✉️</span>
                  <span>info@kagunitychurch.org</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">🕐</span>
                  <span>Sun: 8:00 AM & 10:30 AM</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex w-5 h-5 rounded-full bg-[#25D366] text-white items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-3 h-3" />
                  </span>
                  <a href="https://wa.me/254725812019" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition font-medium">WhatsApp: +254 725 812019</a>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">📘</span>
                  <a href="https://www.facebook.com/KAGunity" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition">Facebook</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-200 dark:border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <p className="text-center md:text-left flex items-center gap-2">
                <span>©</span>
                <span>{new Date().getFullYear()} KAG Unity Church. All rights reserved.</span>
              </p>
              <div className="flex items-center gap-4">
                <Link to="/privacy-policy" className="hover:text-primary-600 transition">Privacy Policy</Link>
                <span className="text-gray-300 dark:text-slate-600">|</span>
                <Link to="/terms" className="hover:text-primary-600 transition">Terms of Service</Link>
              </div>
              <p className="text-center md:text-right text-xs text-gray-400 dark:text-slate-500">
                Developed with ❤️ by billymbasilu@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}