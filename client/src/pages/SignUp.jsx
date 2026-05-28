import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignUp() {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null) // Reset error state

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      console.log('Response:', data) // Debugging output

      if (!data || data.success === false) {
        setError(data?.message || 'Signup failed')
        setLoading(false)
        return
      }

      setLoading(false)
      console.log('Navigating to sign-in...')
      setTimeout(() => navigate('/sign-in'), 500) // Delay navigation slightly
    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7 dark:text-gray-200">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          id="username"
          onChange={handleChange}
          className="border p-3 rounded-lg dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
        />
        <input
          type="email"
          placeholder="Email"
          id="email"
          onChange={handleChange}
          className="border p-3 rounded-lg dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
        />
        <input
          type="password"
          placeholder="Password"
          id="password"
          onChange={handleChange}
          className="border p-3 rounded-lg dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
        />
        <button
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
      <div className="flex gap-2 mt-5">
        <p className="dark:text-gray-300">Have an account?</p>
        <Link to={'/sign-in'}>
          <span className="text-blue-700 dark:text-blue-400">Sign in</span>
        </Link>
      </div>
      {error && <p className="text-red-500 mt-5">{error}</p>}
    </div>
  )
}
