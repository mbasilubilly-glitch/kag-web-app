export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Tailwind's default .container has no auto-centering and no
    // padding unless set here - most pages in this app use bare
    // `className="container ..."` with nothing to compensate, so
    // without `center: true` every one of them sits flush against the
    // left edge (with a growing empty gap on the right) on any screen
    // wider than the 2xl breakpoint below (1536px) - i.e. most desktop
    // monitors and any TV. `padding` also gives the ones with no
    // explicit px-* of their own room to breathe on mobile instead of
    // touching the screen edges. Capping `screens` at the same values
    // as Tailwind's default breakpoints (nothing past 2xl) is
    // deliberate: content should stop growing past ~1536px and center
    // with space on either side, not stretch edge-to-edge on a 4K TV.
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      // System font stacks only - no external font CDN. Fonts loaded from
      // Google Fonts fail hard (not just "ugly fallback") on any network
      // that blocks/intercepts fonts.gstatic.com (corporate firewalls, some
      // security software, some ISPs) - the browser gets back something
      // that isn't valid font data and can't render it at all. Every OS
      // already ships strong sans/serif faces, so there's nothing to gain
      // from that dependency and a real reliability cost to keeping it.
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      colors: {
        // Brand palette - deep blue primary / gold accent. Light-theme
        // primary is 900 (#1E3A8A), dark-theme primary is 600 (#2563EB);
        // secondary is the light-theme gold (#D4AF37 at 500), accent is
        // the brighter dark-theme gold (#FACC15 at 500).
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf8ec',
          100: '#faf0d2',
          200: '#f3e0a8',
          300: '#eaca74',
          400: '#ddb452',
          500: '#d4af37',
          600: '#b8932a',
          700: '#8f7020',
          800: '#6b5418',
          900: '#4a3a10',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1E293B',
        },
        canvas: {
          DEFAULT: '#F8FAFC',
          dark: '#0F172A',
        },
        accent: {
          50: '#fffceb',
          100: '#fff6c2',
          200: '#ffec85',
          300: '#ffe14d',
          400: '#fdd026',
          500: '#facc15',
          600: '#d4a70a',
          700: '#a67f08',
          800: '#785c08',
          900: '#4d3b06',
        },
        success: {
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #17356a 0%, #1e4685 55%, #2f5fa6 100%)',
        'gradient-hero-alt': 'linear-gradient(135deg, #0d1f3f 0%, #17356a 55%, #224f4f 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(23, 53, 106, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)',
        'gradient-section': 'linear-gradient(135deg, rgba(23, 53, 106, 0.03) 0%, rgba(212, 175, 55, 0.03) 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f3e0a8 0%, #d4af37 50%, #b8932a 100%)',
        'gradient-cool': 'linear-gradient(135deg, #1e4685 0%, #d4af37 50%, #f3e0a8 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(88, 101, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(88, 101, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}