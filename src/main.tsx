import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './components/admin/AdminApp';
import './index.css';
import { I18nProvider } from './i18n';

const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      {isAdminRoute ? <AdminApp /> : <App />}
    </I18nProvider>
  </StrictMode>,
);
