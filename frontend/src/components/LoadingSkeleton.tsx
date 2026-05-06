export default function LoadingSkeleton() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3 space-y-2">
        <div className="h-3 bg-slate-200 rounded animate-pulse w-64" />
        <div className="h-3 bg-slate-200 rounded animate-pulse w-48" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-32" />
      </div>
    </div>
  )
}
