import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '@/layouts/AdminLayout';
import { navigationItems } from '@/pages/page-data';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { ContentTypesPage } from '@/pages/content-types/ContentTypesPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Root route */}
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/content-manager"
              element={
                <PlaceholderPage
                  page={
                    navigationItems.find(
                      (page) => page.path === '/content-manager',
                    )!
                  }
                />
              }
            />

            <Route
              path="/content-types"
              element={<ContentTypesPage />}
            />

            {navigationItems
              .filter(
                (page) =>
                  page.path !== '/content-manager' &&
                  page.path !== '/content-types',
              )
              .map((page) => (
                <Route
                  key={page.path}
                  path={page.path}
                  element={<PlaceholderPage page={page} />}
                />
              ))}

            <Route
              path="*"
              element={<Navigate to="/content-manager" replace />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;