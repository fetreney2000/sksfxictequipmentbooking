import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'

registerSW({ immediate: true })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mutations explicitly invalidate and await fresh data. A short stale
      // window also prevents navigating back to a list from showing old data.
      staleTime: 0,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
