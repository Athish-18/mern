import { useSelector } from 'react-redux'

export default function ThemeProvider({ children }) {
  const { theme } = useSelector((state) => state.theme)

  return (
    <div className={theme}>
      <div className="bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-gray-200 min-h-screen transition-colors duration-300">
        {children}
      </div>
    </div>
  )
}
