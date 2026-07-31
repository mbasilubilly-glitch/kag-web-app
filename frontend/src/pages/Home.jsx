import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import {
  HeroWorshipGraphic,
  CommunityGraphic,
  IconSermon,
  IconEvents,
  IconGraduation,
  IconHandshake,
  IconClock,
  IconPray,
  IconPin,
} from '../components/ChurchGraphics'

// Photo slots: each GraphicBlock renders a hand-built church-themed SVG
// graphic until a real photo is supplied. To swap in a real photo later,
// replace the `graphic` prop's element with an
// `<img src="..." className="h-full w-full object-cover" />` inside the
// same rounded container - no other markup needs to change.
function GraphicBlock({ graphic, label, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">{graphic}</div>
      {label && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-wide text-white/90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  )
}

// Real photo with a graceful fallback: renders the given <img> src, and if
// that file doesn't exist yet (drop it into frontend/public/images/ to
// activate it), falls back to the hand-built SVG graphic instead of a
// broken-image icon.
function Photo({ src, alt, className = '', fallback }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 flex items-center justify-center ${className}`}>
        {fallback}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}

// Hero slides: auto-cycling background with a Ken Burns zoom and a
// cross-fade between slides. Only one real photo exists today, so this
// just slowly zooms it - the fade cycle activates on its own the moment a
// second/third path is added to HERO_IMAGES below (drop more photos into
// frontend/public/images/ and list them here, e.g. 'hero-2.webp').
function HeroCarousel({ images, alt, fallback }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 9000)
    return () => clearInterval(id)
  }, [images.length])

  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
        >
          <Photo src={src} alt={alt} className="absolute inset-0 w-full h-full animate-ken-burns" fallback={fallback} />
        </div>
      ))}
    </div>
  )
}

const HERO_IMAGES = ['/images/hero.webp']

export default function Home() {
  const [featuredGallery, setFeaturedGallery] = useState(null)
  const [galleryLoading, setGalleryLoading] = useState(true)

  useEffect(() => {
    api.get('/galleries/?featured_only=true')
      .then((res) => {
        const gallery = res.data?.[0]
        if (!gallery) return
        return api.get(`/galleries/${gallery.id}/`).then((r) => setFeaturedGallery(r.data))
      })
      .catch(() => setFeaturedGallery(null))
      .finally(() => setGalleryLoading(false))
  }, [])

  const galleryPhotos = [
    ...(featuredGallery?.items || []),
    ...(featuredGallery?.albums || []).flatMap((a) => a.items || []),
  ].filter((i) => i.item_type === 'photo')

  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark transition-colors duration-300">
      {/* Hero - full-screen church photo carousel with a slow Ken Burns
          zoom, cross-fading between slides every 9s (see HERO_IMAGES
          above). Falls back to the hand-built worship graphic if the photo
          is ever missing. */}
      <section className="relative min-h-screen flex items-center text-white overflow-hidden">
        <HeroCarousel
          images={HERO_IMAGES}
          alt="KAG Unity Church"
          fallback={<HeroWorshipGraphic className="absolute inset-0 h-full w-full" />}
        />
        {/* Flat, uniform overlay for text contrast - rgba(0,0,0,0.5) */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container px-4 py-20 md:py-32">
          <div className="max-w-2xl space-y-6">
            <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full animate-fadeInUp">
              <span className="text-secondary-300 text-sm font-semibold uppercase tracking-wide">Welcome Home</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight text-balance animate-fadeInUp-delay-1">
              A Place to Belong, <br className="hidden sm:block" />
              Grow, and Serve
            </h1>
            <p className="text-lg text-primary-100 max-w-xl leading-relaxed animate-fadeInUp-delay-2">
              KAG Unity Church connects members, pastors, and visitors with sermons, events, and spiritual
              support — wherever you are.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 animate-fadeInUp-delay-3">
              <Link
                to="/live"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-secondary-400 text-primary-900 font-bold rounded-full shadow-lg transition-all duration-300 hover:bg-secondary-300 hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105"
              >
                Watch Live
              </Link>
              <Link
                to="/sermons"
                className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/70 text-white font-bold rounded-full transition-all duration-300 hover:bg-white hover:text-primary-800 hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105"
              >
                Watch Sermons
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4">
        {/* Service Times / Join / Contact */}
        <div className="grid gap-6 md:grid-cols-3 -mt-10 md:-mt-14 relative z-10 mb-16">
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-slate-700">
            <IconClock className="w-9 h-9 text-primary-600 dark:text-primary-400 mb-4" />
            <h2 className="font-display text-xl font-bold text-primary-800 dark:text-primary-300 mb-4">Service Times</h2>
            <ul className="space-y-3 text-gray-700 dark:text-slate-300 text-sm">
              <li className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2"><span className="font-semibold">Sunday 1st</span><span className="text-primary-600 dark:text-primary-400">8:00 AM</span></li>
              <li className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2"><span className="font-semibold">Sunday 2nd</span><span className="text-primary-600 dark:text-primary-400">10:30 AM</span></li>
              <li className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2"><span className="font-semibold">Bible Study</span><span className="text-primary-600 dark:text-primary-400">Mon 6 PM</span></li>
              <li className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2"><span className="font-semibold">Prayer Meeting</span><span className="text-primary-600 dark:text-primary-400">Fri 7 PM</span></li>
              <li className="flex justify-between"><span className="font-semibold">Youth Service</span><span className="text-primary-600 dark:text-primary-400">Sat 5 PM</span></li>
            </ul>
          </div>

          <div className="bg-primary-800 rounded-2xl p-8 shadow-xl text-white">
            <IconPray className="w-9 h-9 text-secondary-300 mb-4" />
            <h2 className="font-display text-xl font-bold mb-3">Join Us</h2>
            <p className="text-primary-100 text-sm mb-6">Register as a visitor or member and connect with the church community.</p>
            <div className="space-y-3">
              <Link to="/signin" className="block w-full px-5 py-3 bg-white text-primary-800 font-bold text-center rounded-lg hover:bg-primary-50 transition">Sign In</Link>
              <Link to="/register" className="block w-full px-5 py-3 border-2 border-white/70 text-white font-bold text-center rounded-lg hover:bg-white/10 transition">Create Account</Link>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-slate-700">
            <IconPin className="w-9 h-9 text-primary-600 dark:text-primary-400 mb-4" />
            <h2 className="font-display text-xl font-bold text-primary-800 dark:text-primary-300 mb-4">Contact Us</h2>
            <div className="space-y-3 text-gray-700 dark:text-slate-300 text-sm">
              <p className="flex items-start gap-3"><span>📞</span><span>+254 725 812 019</span></p>
              <p className="flex items-start gap-3"><span>✉️</span><span>info@kagunitychurch.org</span></p>
              <p className="flex items-start gap-3"><span>📍</span><span>Thika Road, Toll Weighbridge 400m from Adva Mall</span></p>
            </div>
          </div>
        </div>

        {/* Featured sections - graphic cards */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-800 dark:text-primary-300 mb-3">Our Services</h2>
            <p className="text-gray-600 dark:text-slate-400">Everything you need for a spiritual journey</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Link to="/sermons" className="group rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-lg hover:shadow-2xl transition">
              <GraphicBlock graphic={<IconSermon className="w-16 h-16 text-white/90" />} label="Sermons" className="h-44" />
              <div className="bg-white dark:bg-surface-dark p-6">
                <h3 className="font-display text-xl font-bold text-primary-800 dark:text-primary-300 mb-2 group-hover:text-primary-600 transition">Featured Sermons</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-3">Latest messages from our pastors, streamable and downloadable for offline study.</p>
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">View Sermons →</span>
              </div>
            </Link>

            <Link to="/events" className="group rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-lg hover:shadow-2xl transition">
              <GraphicBlock graphic={<IconEvents className="w-16 h-16 text-white/90" />} label="Events" className="h-44" />
              <div className="bg-white dark:bg-surface-dark p-6">
                <h3 className="font-display text-xl font-bold text-primary-800 dark:text-primary-300 mb-2 group-hover:text-primary-600 transition">Upcoming Events</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-3">Conferences, worship nights, youth meetings, and outreach programs.</p>
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">View Events →</span>
              </div>
            </Link>

            <Link to="/dream-centre" className="group rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-lg hover:shadow-2xl transition">
              <GraphicBlock graphic={<IconGraduation className="w-16 h-16 text-white/90" />} label="Dream Centre" className="h-44" />
              <div className="bg-white dark:bg-surface-dark p-6">
                <h3 className="font-display text-xl font-bold text-primary-800 dark:text-primary-300 mb-2 group-hover:text-primary-600 transition">Dream Centre</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-3">Mentorship, counselling, skills training, and sponsorship programs.</p>
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">Learn More →</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Gallery - shows the gallery a Church Administrator or the Super
            Administrator has marked "Featured" at /admin/galleries.
            Falls back to graphic placeholders until one is featured. */}
        <div id="gallery" className="mb-16 scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-800 dark:text-primary-300 mb-3">
              {featuredGallery ? featuredGallery.title : 'Gallery'}
            </h2>
            <p className="text-gray-600 dark:text-slate-400">Moments from worship, fellowship, and life together as a church family</p>
          </div>

          {!galleryLoading && galleryPhotos.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[HeroWorshipGraphic, CommunityGraphic, HeroWorshipGraphic, CommunityGraphic].map((Graphic, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 aspect-square flex items-center justify-center">
                  <Graphic className="w-2/3 h-2/3 opacity-80" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryPhotos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.image}
                  alt={photo.caption || 'Church gallery photo'}
                  className="w-full aspect-square object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition"
                />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/galleries" className="inline-flex items-center gap-2 px-7 py-3 border-2 border-primary-600 text-primary-700 font-bold rounded-full hover:bg-primary-600 hover:text-white transition">
              View All Galleries →
            </Link>
          </div>
        </div>

        {/* Ministries */}
        <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-8 md:p-12 mb-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary-800 dark:text-primary-300 mb-4">Get Involved</h2>
              <p className="text-gray-700 dark:text-slate-300 mb-6">Join one of our vibrant ministries and make a meaningful impact in our community.</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="w-2 h-2 bg-secondary-500 rounded-full" /><span>Youth &amp; Teens Ministry</span></li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="w-2 h-2 bg-secondary-500 rounded-full" /><span>Worship &amp; Music Team</span></li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="w-2 h-2 bg-secondary-500 rounded-full" /><span>Men &amp; Women Fellowship</span></li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="w-2 h-2 bg-secondary-500 rounded-full" /><span>Service &amp; Outreach</span></li>
              </ul>
              <Link to="/ministries" className="inline-flex items-center gap-2 px-7 py-3 bg-primary-700 text-white font-bold rounded-lg hover:bg-primary-800 transition shadow-md">
                Explore Ministries →
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 flex items-center justify-center">
              <CommunityGraphic className="w-56 h-56" />
              <IconHandshake className="absolute bottom-4 right-4 w-8 h-8 text-white/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
