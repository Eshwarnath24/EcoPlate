import React, { useState, useEffect } from 'react';
import { THEME } from './theme';
import { useMousePosition } from './hooks';
import GlobalStyles from './components/GlobalStyles';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  const [appState, setAppState] = useState('landing');
  const [images, setImages] = useState({ before: null, after: null });
  const mousePos = useMousePosition();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [appState]);

  return (
    <div style={{ backgroundColor: THEME.bg, color: THEME.text }} className="min-h-screen font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <GlobalStyles />
      
      {/* Subtle warm cursor spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(31,77,58,0.04), transparent 40%)`,
          opacity: mousePos.x ? 1 : 0 
        }} 
      />

      {/* Subtle dot grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <NavBar onHome={() => setAppState('landing')} />
      
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {appState === 'landing' && <LandingPage onStart={() => setAppState('upload')} />}
        {(appState === 'upload' || appState === 'analyzing') && (
          <AnalysisPage images={images} setImages={setImages} appState={appState} setAppState={setAppState} />
        )}
        {appState === 'results' && (
          <ReportPage onReset={() => { setImages({ before: null, after: null }); setAppState('upload'); }} />
        )}
      </main>
    </div>
  );
}