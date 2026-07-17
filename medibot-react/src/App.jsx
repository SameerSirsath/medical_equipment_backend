import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatWidget from './components/ChatWidget.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import CookiePolicy from './pages/CookiePolicy.jsx';
import Terms from './pages/Terms.jsx';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="host-page"><ChatWidget /></div>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  );
}