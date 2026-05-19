import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { authError, setAuthError } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState(params.get('error') === 'not_activated'
    ? 'Your account is pending activation by an administrator.' : '')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleEmailLogin = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (err) setError(err.message)
    else navigate('/products')
    setLoading(false)
  }

  const handleGoogleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const displayError = error || authError

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6 antialiased">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-full max-w-md p-8 sm:p-10">
        
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1.5">Hope, Inc.</h1>
          <p className="text-sm font-medium text-gray-500">Product Management System</p>
        </div>

        {/* Error Notification */}
        {displayError && (
          <div className="bg-red-50/70 border border-red-100 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mb-6 transition-all animate-fade-in flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
            <p className="leading-relaxed">{displayError}</p>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <input
              name="email" type="email" placeholder="Email address" required
              value={form.email} onChange={handleChange}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <input
              name="password" type="password" placeholder="Password" required
              value={form.password} onChange={handleChange}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/10 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-gray-100" />
          <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">or</span>
          <hr className="flex-1 border-gray-100" />
        </div>

        {/* OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full border border-gray-200 bg-white rounded-xl py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Footer Link */}
        <p className="text-center text-xs font-medium text-gray-500 mt-6 tracking-normal">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline underline-offset-4 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}