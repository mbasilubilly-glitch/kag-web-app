export default function DreamCentre() {
  return (
    <div className="min-h-screen pb-10">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white px-4 py-16 md:py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 animate-fadeInUp">
            <span className="text-secondary-200 text-sm font-semibold">🌟 Dream Centre</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeInUp-delay-1">
            Dream <span className="bg-gradient-to-r from-secondary-300 to-secondary-100 bg-clip-text text-transparent">Centre</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto animate-fadeInUp-delay-2">
            Empowering youth and families through mentorship, counseling, skills development, and community outreach.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {[
            {
              icon: '🚀',
              title: 'Youth Empowerment',
              desc: 'Training and mentorship for young leaders, equipping them with skills and confidence to pursue their God-given dreams.',
              color: 'border-t-4 border-primary-600',
              bgColor: 'bg-primary-50',
            },
            {
              icon: '💚',
              title: 'Counselling Services',
              desc: 'Spiritual and emotional support services providing guidance, prayer, and professional counseling for individuals and families.',
              color: 'border-t-4 border-secondary-500',
              bgColor: 'bg-secondary-50',
            },
            {
              icon: '🛠️',
              title: 'Skills Development',
              desc: 'Career and life skills workshops covering vocational training, financial literacy, and personal development.',
              color: 'border-t-4 border-accent-600',
              bgColor: 'bg-accent-50',
            },
          ].map((program, index) => (
            <div
              key={program.title}
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition ${program.color} transform hover:-translate-y-2 ${
                index === 0 ? 'animate-fadeInUp-delay-1' : index === 1 ? 'animate-fadeInUp-delay-2' : 'animate-fadeInUp-delay-3'
              }`}
            >
              <div className="text-5xl mb-4">{program.icon}</div>
              <h2 className="text-2xl font-bold text-primary-800 mb-4">{program.title}</h2>
              <p className="text-gray-700 leading-relaxed">{program.desc}</p>
            </div>
          ))}
        </div>

        {/* Impact Stats */}
        <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 text-white mb-12 animate-fadeInUp">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            {[
              { number: '500+', label: 'Youth Mentored', icon: '👥' },
              { number: '50+', label: 'Workshops Held', icon: '📚' },
              { number: '200+', label: 'Families Supported', icon: '🏠' },
              { number: '100+', label: 'Volunteers Active', icon: '🤝' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="text-4xl">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-secondary-300">{stat.number}</div>
                <div className="text-primary-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Get Involved */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12 border-l-4 border-secondary-500 animate-fadeInUp">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-5xl mb-4">🌈</div>
              <h2 className="text-3xl font-bold text-primary-800 mb-4">Get Involved</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Whether you want to volunteer, sponsor a program, or enroll in a skills training course,
                the Dream Centre has a place for you.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🙋 Volunteer</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">💰 Sponsor</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">📝 Enroll</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🤲 Partner</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-8 text-white text-center">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-lg font-semibold">Dream Big, Achieve More</p>
                <p className="text-primary-200 text-sm mt-2">With God, all things are possible</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}