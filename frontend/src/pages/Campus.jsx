export default function Campus() {
  return (
    <div className="min-h-screen pb-10">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white px-4 py-16 md:py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 animate-fadeInUp">
            <span className="text-secondary-200 text-sm font-semibold">📍 Our Location</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeInUp-delay-1">
            KAG Unity <span className="bg-gradient-to-r from-secondary-300 to-secondary-100 bg-clip-text text-transparent">Juja Toll Campus</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto animate-fadeInUp-delay-2">
            Find service times, campus leadership, directions, and contact information.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Service Times */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-primary-600 transform hover:-translate-y-2 animate-slideInLeft">
            <div className="text-5xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-6">Service Times</h2>
            <div className="space-y-4">
              <div className="bg-primary-50 rounded-xl p-4">
                <h3 className="font-bold text-primary-700 mb-2">Sunday Services</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between items-center pb-2 border-b border-primary-100">
                    <span>First Service</span>
                    <span className="text-primary-600 font-semibold">8:00 AM</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Second Service</span>
                    <span className="text-primary-600 font-semibold">10:30 AM</span>
                  </li>
                </ul>
              </div>
              <div className="bg-accent-50 rounded-xl p-4">
                <h3 className="font-bold text-accent-700 mb-2">Midweek Services</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between items-center pb-2 border-b border-accent-100">
                    <span>Bible Study</span>
                    <span className="text-accent-600 font-semibold">Mon 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-accent-100">
                    <span>Homecell Fellowships</span>
                    <span className="text-accent-600 font-semibold">Wed/Thu 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Prayer & Evening Service</span>
                    <span className="text-accent-600 font-semibold">Fri 7:00 PM</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-secondary-500 transform hover:-translate-y-2 animate-slideInRight">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-6">Church Location</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-secondary-50 rounded-xl">
                <span className="text-2xl">📌</span>
                <div>
                  <h3 className="font-bold text-primary-700 mb-1">Address</h3>
                  <p className="text-gray-700">
                    Thika Road, Juja Toll, Weighbridge
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-xl">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
                <div>
                  <h3 className="font-bold text-primary-700 mb-1">Church Pastor</h3>
                  <p className="text-gray-700 font-semibold">Rev. Peter Kiarie</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-accent-50 rounded-xl">
                <span className="text-2xl">📞</span>
                <div>
                  <h3 className="font-bold text-accent-700 mb-1">Contact</h3>
                  <p className="text-gray-700">+254 725 812 019</p>
                  <p className="text-gray-600 text-sm">info@kagunitychurch.org</p>
                </div>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/JLpRmyqLrNqQPdcE8"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-hero text-white font-bold rounded-xl hover:shadow-lg transition transform hover:-translate-y-1"
            >
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>

        {/* Directions Card */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12 border-l-4 border-primary-600 animate-fadeInUp">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-5xl mb-4">🚗</div>
              <h2 className="text-3xl font-bold text-primary-800 mb-4">Getting Here</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Located along Thika Road at Toll Weighbridge, 400 meters from Adva Mall next to the Safaricom mast (Booster).
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🚌 Public Transport</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🅿️ Free Parking</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">♿ Wheelchair Access</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-8 text-white text-center">
                <div className="text-6xl mb-4">🙏</div>
                <p className="text-lg font-semibold">You Are Welcome Here</p>
                <p className="text-primary-200 text-sm mt-2">Join us this Sunday!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}