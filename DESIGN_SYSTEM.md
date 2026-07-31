# KAG Unity Church PWA - Design System Guide

> **2026-07 refresh:** `Navbar.jsx` and `Sidebar.jsx` had drifted onto a hardcoded Tailwind `red-*` palette that clashed with the documented primary/secondary/accent system used everywhere else in the app — fixed back onto tokens (`bg-gradient-hero`, `bg-gradient-hero-alt`, `primary-*`). Also added real typography (previously "default sans-serif"): a **Sora** display face for headings (`font-display`) paired with **Work Sans** for body copy (`font-sans`, applied globally). Home's hero and card-grid pattern were kept and lightly refined — welcome banner with eyebrow badge, headline, subhead, dual CTA, followed by card-based service/ministry blocks — the same structural shape used by well-run church sites generally (a large welcome hero, then scannable card grids for services/ministries), not copied from any single reference site's copy or imagery.
>
> **2026-07 pass 2 — palette shift + photo-ready cards:** Primary color scale moved from indigo/purple (`#3030d6`/`#5865ff`) to a navy blue scale (`#17356a`/`#1e4685`), and the accent scale moved from purple to teal (`#347d7a`), for a cleaner, more minimal, photography-forward feel — inspired by the *structure and tone* of professional church websites generally (clean white sections, navy accents, card-based photo blocks), not any single site's actual content, logo, or images. Because the app's components consume these as Tailwind tokens (`primary-*`, `gradient-hero`, etc.) rather than hardcoded hex values, this cascades automatically to every page (Navbar, Sidebar, buttons, badges) without per-file edits. Home.jsx's photo-less emoji cards were replaced with a reusable `PhotoBlock` component — a styled gradient placeholder in the exact shape/position a real photo will occupy — so real church photography can be dropped in later by swapping one `<img>` tag per block, no layout changes needed.
>
> **2026-07 pass 3 — Inter/Merriweather + Deep Blue/Gold:** Display font switched from Poppins to **Merriweather** (serif, headings only — a church-friendly, trustworthy tone) and body copy confirmed on **Inter**; both now also globalized via plain CSS (`h1`–`h6` use `var(--font-heading)` in `index.css`) so headings pick up the serif face even without the `font-display` class. `secondary-*` and `accent-*` Tailwind scales were replaced with two gold scales anchored on **#D4AF37** (light theme, `secondary-500`) and **#FACC15** (dark theme, `accent-500`) — this also fixes prior drift where this doc's "Secondary Colors (Amber/Gold)" text hadn't matched the teal hex values actually in `tailwind.config.js`. The `primary` blue scale was left unchanged: `primary-900` (`#1E3A8A`) and `primary-600` (`#2563EB`) already matched the recommended light/dark primary exactly. `--font-body`, `--font-heading`, `--color-primary`, `--color-accent`, `--color-background`, `--color-surface`, `--color-text` CSS custom properties were added to `:root` / `:root[data-theme='dark']` in `index.css` for use outside Tailwind class contexts (e.g. inline styles, print/PDF views).

## 🎨 Color Palette

### Primary Colors (Deep Blue)
- **Primary-900**: `#1e3a8a` - Main brand color (light theme), headers, important elements
- **Primary-600**: `#2563eb` - Main brand color (dark theme), interactive elements, buttons
- **Primary-500**: `#3b82f6` - Secondary interactions
- Used for: Sidebar, buttons, links, badges

### Secondary Colors (Gold)
- **Secondary-500**: `#d4af37` - Accent, highlights, premium elements (light theme)
- **Secondary-400**: `#ddb452` - Badge backgrounds
- **Secondary-300**: `#eaca74` - Hover states
- Used for: Special highlights, badges, decorative accents

### Accent Colors (Bright Gold)
- **Accent-500**: `#facc15` - Main accent (dark theme), alternative highlights
- **Accent-400**: `#fdd026` - Secondary callouts
- Used for: Additional visual interest, category badges, dark-theme highlights

### Status Colors
- **Success**: `#10b981` - Positive actions, confirmations
- **Warning**: `#f59e0b` - Cautions, alerts
- **Danger**: `#ef4444` - Errors, delete actions

### Neutrals
- **White**: `#ffffff` - Card backgrounds, clear sections
- **Gray-50 to Gray-900**: Background gradients, text hierarchy
- **Primary-50 to Primary-100**: Soft backgrounds for secondary cards

---

## 🎯 Component Styles

### Buttons

**Primary Action Button**
```jsx
<button className="px-8 py-4 bg-gradient-hero text-white font-bold rounded-full hover:shadow-lg transition shadow-md">
  Action Text
</button>
```
- Uses gradient hero (Primary-700 → Primary-600 → Accent-700)
- Rounded-full (pill shape)
- Shadow on hover
- Used for main CTAs

**Secondary Button**
```jsx
<button className="px-8 py-4 border-2 border-secondary-400 text-secondary-600 font-bold rounded-lg hover:bg-secondary-50">
  Secondary Action
</button>
```
- Border style with secondary color
- Hover background is light secondary
- Used for alternative actions

**Icon Buttons**
Include emoji icons for visual interest:
- 📊 Dashboard
- 🎥 Sermons
- 📅 Events
- 👤 Profile
- 🔑 Authentication
- etc.

### Cards

**Featured Card with Border**
```jsx
<div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-primary-600">
  {/* content */}
</div>
```
- White background
- Top border accent (primary, secondary, or accent color)
- Rounded corners (2xl)
- Hover lift effect (shadow increase)

**Gradient Background Card**
```jsx
<div className="bg-gradient-card border border-primary-200 rounded-2xl p-8 shadow-lg">
  {/* content */}
</div>
```
- Uses subtle gradient from tailwind config
- Light border
- Used for secondary content

### Headers

**Page Hero Section**
```jsx
<section className="bg-gradient-hero text-white px-4 py-12 md:py-16">
  <h1 className="text-4xl md:text-5xl font-bold mb-4">Page Title</h1>
  <p className="text-lg text-primary-100">Subtitle/description</p>
</section>
```
- Full width gradient hero
- Large typography with good hierarchy
- White text on primary gradient

### Navigation

**Sidebar Active Link**
```jsx
<Link className="px-4 py-3 rounded-lg bg-secondary-400 text-primary-800 shadow-md">
  Active Link
</Link>
```
- Secondary background when active
- Primary text when active
- Smooth transitions

**Sidebar Inactive Link**
```jsx
<Link className="px-4 py-3 rounded-lg text-primary-50 hover:bg-primary-600/50">
  Inactive Link
</Link>
```
- Light text on dark primary background
- Hover state with slight background increase

---

## 📐 Spacing & Layout

### Container
- Max width: 6xl (1152px)
- Padding: 4 sides (px-4 sm:px-6)
- Margin: auto (centered)

### Section Spacing
- Vertical: py-12 (default), py-16 (hero), py-10 (content)
- Horizontal: px-4 (mobile), px-6 (desktop)

### Component Spacing
- Card padding: p-8 (default), p-6 (compact)
- Gap between elements: gap-6, gap-8, gap-4
- Border radius: rounded-lg (8px), rounded-2xl (16px), rounded-full (999px)

---

## 🌐 Typography

### Fonts
- **Display (`font-display`)**: Merriweather, 400/700 weight — used on headings only, for a trustworthy, church-friendly voice. Also applied globally to `h1`–`h6` via plain CSS in `index.css` (`var(--font-heading)`), so it applies even without the class.
- **Body (`font-sans`, default)**: Inter — applied globally via Tailwind's base styles, no class needed
- Both loaded via Google Fonts in `index.html`; configured in `tailwind.config.js` under `theme.extend.fontFamily`, and mirrored as `--font-body`/`--font-heading` CSS variables in `index.css` for non-Tailwind contexts

### Headings
- H1: `font-display text-4xl md:text-5xl font-bold`
- H2: `font-display text-3xl md:text-4xl font-bold`
- H3: `font-display text-2xl font-bold`
- H4: `font-display text-xl font-bold`

### Text
- Body: text-base (default)
- Small: text-sm
- Tiny: text-xs
- Emphasis: font-semibold, font-bold

### Color Text Hierarchy
1. **Primary text**: text-gray-900, text-primary-800
2. **Secondary text**: text-gray-700, text-primary-600
3. **Tertiary text**: text-gray-600, text-primary-200
4. **Disabled text**: text-gray-400, opacity-50

---

## ✨ Special Elements

### Gradients (in tailwind.config.js)

**Hero Gradient**
```
gradient-hero: linear-gradient(135deg, #3030d6 0%, #5865ff 50%, #6d28d9 100%)
```
- Used for hero sections and primary buttons
- Deep blue to vibrant blue to deep purple

**Card Gradient**
```
gradient-card: linear-gradient(135deg, rgba(48, 48, 214, 0.05) 0%, rgba(107, 40, 217, 0.05) 100%)
```
- Subtle gradient for card backgrounds
- Very light, mostly transparent

### Animations
- `hover:-translate-y-2`: Card lift effect
- `hover:shadow-xl`: Shadow increase
- `transition`: Smooth transitions
- `hover:scale-110`: Icon scale on hover

### Loading States
```jsx
<div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
```
- Border spinner animation
- Primary colors

---

## 🎬 Page Structure Template

```jsx
<div className="min-h-screen pb-10">
  {/* Hero Section */}
  <section className="bg-gradient-hero text-white px-4 py-12 md:py-16">
    <div className="container max-w-4xl mx-auto text-center">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Page Title</h1>
      <p className="text-lg text-primary-100">Description</p>
    </div>
  </section>

  {/* Content Section */}
  <div className="container px-4 py-12">
    {/* Grid of cards, content, etc. */}
  </div>
</div>
```

---

## 📱 Responsive Design

- **Mobile First**: Start with mobile layout, then add breakpoints
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid**: md:grid-cols-2, lg:grid-cols-3
- **Padding**: px-4 (mobile), sm:px-6 (tablet), px-4 (desktop with container)

---

## ♿ Accessibility

- Use semantic HTML (buttons, links, forms)
- Include alt text for images
- Maintain color contrast ratio of at least 4.5:1
- Use aria-labels for icon buttons
- Ensure focus states are visible

---

## 🚀 Implementation Checklist

When building new pages:
- [ ] Use primary gradient for hero sections
- [ ] Use gradient-card for secondary sections
- [ ] Include emoji icons for visual interest
- [ ] Use border-t-4 with appropriate color on cards
- [ ] Implement hover effects (shadow, lift)
- [ ] Include loading states
- [ ] Add error states with danger-50 background
- [ ] Ensure responsive design (mobile, tablet, desktop)
- [ ] Use consistent spacing
- [ ] Test accessibility

---

## 📦 Files Modified

1. `tailwind.config.js` - Custom color scheme
2. `src/index.css` - Global styles and animations
3. `src/App.jsx` - Background gradient
4. `src/components/Navbar.jsx` - Primary gradient header
5. `src/components/Sidebar.jsx` - Gradient sidebar with icons
6. `src/components/Footer.jsx` - Footer styling
7. `src/pages/Home.jsx` - Complete redesign
8. `src/pages/Sermons.jsx` - Card-based layout
9. `src/pages/Events.jsx` - Enhanced event cards
10. `src/pages/SignIn.jsx` - Centered form design
11. `src/pages/Register.jsx` - Multi-step form design
12. `src/pages/Dashboard.jsx` - Dashboard with stats

---

## 🎨 Brand Identity

- **Font**: Merriweather (display/headings) + Inter (body) — see Typography section
- **Logo Icon**: K in rounded box (primary gradient)
- **Emoji Usage**: Enhance visual communication and accessibility
- **Rounded Corners**: Modern, friendly aesthetic
- **Gradient Usage**: Premium, professional feel
- **Color Psychology**:
  - Blue (Primary): Trust, spirituality, stability
  - Gold (Secondary/Accent): Joy, enlightenment, warmth

