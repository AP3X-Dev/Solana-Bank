import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// Temporarily commented out until dependencies are installed
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SolanaProvider } from './context/SolanaContext'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { AccountsPage } from './pages/AccountsPage'
import { AccountDetails } from './pages/AccountDetails'
import { CreateAccount } from './pages/CreateAccount'
import { TransferPage } from './pages/TransferPage'
import { BillPayPage } from './pages/BillPayPage'
import { CardsPage } from './pages/CardsPage'
import { SavingsGoalsPage } from './pages/SavingsGoalsPage'
import { Header } from './components/Header'
// import { ToastContainer } from './components/ui/Toast'
// import { queryClient } from './lib/queryClient'

function App() {
  return (
    // Temporarily using old structure until dependencies are installed
    <BrowserRouter>
      <SolanaProvider>
        <AuthProvider>
          <div className="min-h-screen bg-dark text-light-text">
            <Header />
            <main className="pt-4 pb-16">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/account/new" element={<CreateAccount />} />
                <Route path="/account/:id" element={<AccountDetails />} />
                <Route path="/transfer" element={<TransferPage />} />
                <Route path="/bill-pay" element={<BillPayPage />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/goals" element={<SavingsGoalsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </SolanaProvider>
    </BrowserRouter>
  )
}

export default App;