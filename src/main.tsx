import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { AppShell } from './components/layout/AppShell'
import { AppStoreProvider } from './store/AppStore'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/Calendar'
import Appointments from './pages/Appointments'
import Customers from './pages/Customers'
import Services from './pages/Services'
import Automations from './pages/Automations'
import Customize from './pages/Customize'
import Settings from './pages/Settings'
import BookIndex from './pages/BookIndex'
import Book from './pages/Book'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/demo" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="customers" element={<Customers />} />
            <Route path="services" element={<Services />} />
            <Route path="automations" element={<Automations />} />
            <Route path="customize" element={<Customize />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/book" element={<BookIndex />} />
          <Route path="/book/:business" element={<Book />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStoreProvider>
  </StrictMode>,
)
