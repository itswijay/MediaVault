export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-700 bg-slate-900/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-slate-500 text-sm">
          &copy; {currentYear} MediaVault. All rights reserved.
        </p>
      </div>
    </footer>
  )
}