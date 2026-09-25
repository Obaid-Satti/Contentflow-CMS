import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '@/layouts/AdminLayout';
import { navigationItems } from '@/pages/page-data';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { ContentTypesPage } from '@/pages/content-types/ContentTypesPage';
import { ContentManagerPage } from '@/pages/content-manager/ContentManagerPage';
import { MediaLibraryPage } from '@/pages/media-library/MediaLibraryPage';
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
              element={<ContentManagerPage />}
            />
            <Route path="/content-manager/:contentTypeId" element={<ContentManagerPage />} />
            <Route path="/content-manager/:contentTypeId/entries/new" element={<ContentManagerPage />} />
            <Route path="/content-manager/:contentTypeId/entries/:entryId" element={<ContentManagerPage />} />

            <Route
              path="/content-types"
              element={<ContentTypesPage />}
            />
            <Route path="/media-library" element={<MediaLibraryPage />} />

            {navigationItems
              .filter(
                (page) =>
                  page.path !== '/content-manager' &&
                  page.path !== '/content-types' &&
                  page.path !== '/media-library',
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
