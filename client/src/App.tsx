import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { navigationItems } from '@/pages/page-data';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/content-manager" replace />} />
          {navigationItems.map((page) => <Route key={page.path} path={page.path} element={<PlaceholderPage page={page} />} />)}
          <Route path="*" element={<Navigate to="/content-manager" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
