export default function AboutUs() {
  return (
    <div className="min-h-screen pb-10">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white px-4 py-16 md:py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 animate-fadeInUp">
            <span className="text-secondary-200 text-sm font-semibold">🙏 Our Story</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeInUp-delay-1">
            About <span className="bg-gradient-to-r from-secondary-300 to-secondary-100 bg-clip-text text-transparent">KAG Unity Church</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto animate-fadeInUp-delay-2">
            We exist to raise disciples and transform communities through the power of Jesus Christ.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-primary-600 transform hover:-translate-y-2 animate-slideInLeft">
            <div className="text-5xl mb-4">👁️</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To be a united body of believers totally committed to Christ, impacting and giving hope to people through the Gospel, vibrant Worship and Praise.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-secondary-500 transform hover:-translate-y-2 animate-slideInRight">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To know God and make Him known through Evangelism and Discipleship.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12 border-l-4 border-primary-600 mb-12 animate-fadeInUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">💎</div>
            <h2 className="text-3xl font-bold text-primary-800 mb-3">Our Core Values</h2>
            <div className="section-divider"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🤝', title: 'Honesty', desc: 'Walking in truth and transparency' },
              { icon: '🛡️', title: 'Integrity', desc: 'Upholding moral and ethical standards' },
              { icon: '⭐', title: 'Excellence', desc: 'Striving for the highest quality' },
              { icon: '🤲', title: 'Unity', desc: 'Together as one body in Christ' },
              { icon: '👐', title: 'Servanthood', desc: 'Serving others with humility' },
              { icon: '👑', title: 'Quality Leadership', desc: 'Leading with vision and purpose' },
            ].map((value, index) => (
              <div key={value.title} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-primary-100 transform hover:-translate-y-1">
                <div className="text-3xl mb-3">{value.icon}</div>
                <h3 className="text-lg font-bold text-primary-800 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scripture */}
        <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 text-white text-center animate-scaleIn">
          <div className="max-w-2xl mx-auto">
            <div className="text-5xl mb-6">📖</div>
            <p className="text-xl md:text-2xl leading-relaxed font-light italic mb-6">
              "Bless the Lord, O my soul, and all that is within me, bless His Holy Name."
            </p>
            <div className="w-16 h-0.5 bg-secondary-400 mx-auto mb-4"></div>
            <p className="text-secondary-200 font-semibold">— Psalms 103:1</p>
          </div>
        </div>
      </div>
    </div>
  )
}