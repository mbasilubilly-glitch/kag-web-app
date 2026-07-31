export default function MinistryComingSoon({ title, description }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 mb-4">
        Coming soon
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-slate-600 mt-2 max-w-xl">{description}</p>
    </div>
  )
}
