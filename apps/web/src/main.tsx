import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './app/Layout';
import { RequireAuth } from './app/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CasesPage } from './pages/CasesPage';
import { AskDocuments } from './pages/AskDocuments';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { RegisterPage } from './pages/RegisterPage';
import { SavedAnswers } from './pages/SavedAnswers';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:caseId/ask" element={<AskDocuments />} />
              <Route path="/cases/:caseId/saved" element={<SavedAnswers />} />
              <Route path="/cases/:caseId" element={<CaseDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
