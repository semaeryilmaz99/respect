import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabase } from './config/supabase.js'

// Supabase client'ını global scope'a ekle (development için)
if (import.meta.env.DEV) {
  window.supabase = supabase;
  console.log('🔧 Supabase client global scope\'a eklendi (development)');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
