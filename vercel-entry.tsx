import { createRoot } from 'react-dom/client';
import Home from './app/page';
import AdminPage from './app/admin/page';
import './app/globals.css';

const Page = window.location.pathname.startsWith('/admin') ? AdminPage : Home;

createRoot(document.getElementById('root')!).render(<Page />);
