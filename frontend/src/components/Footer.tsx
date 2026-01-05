import { Link } from 'react-router-dom'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-700 bg-slate-900/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left text-slate-500 text-sm">
            &copy; {currentYear} MediaVault. All rights reserved.
          </p>
          <Link
            to="/contact"
            className="text-slate-400 hover:text-cyan-400 text-sm transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  )
}
