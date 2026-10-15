import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { THEME } from './theme';
import { useMousePosition, useScrollProgress } from './hooks';
import GlobalStyles from './components/GlobalStyles';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';
import CodedNatureBackground from './components/CodedNatureBackground';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [images, setImages] = useState(
    Array.from({ length: 6 }, (_, i) => ({ id: i + 1, before: null, after: null, activePreset: null }))
  );
  const [selectedModel, setSelectedModel] = useState('yolo'); // 'yolo' | 'cnn' | 'compare'
  const [analysisResult, setAnalysisResult] = useState(null);

  const mousePos = useMousePosition();
  const scrollProgress = useScrollProgress();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname]);

  // Dynamic cursor glow: orange grows into a wider, warmer glow as you scroll
  const cursorRadius = 600 + scrollProgress * 400;
  const cursorOpacity = 0.05 + scrollProgress * 0.06;

  // Dot grid fades as fire intensifies
  const dotOpacity = 0.20 - scrollProgress * 0.15;

  return (
    <div style={{ color: THEME.text, backgroundColor: THEME.bg }} className="min-h-screen font-sans overflow-x-hidden selection:bg-orange-500/30 relative">
      <GlobalStyles />
      
      {location.pathname !== '/' && <CodedNatureBackground />}

      {/* Subtle warm cursor spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(${cursorRadius}px circle at ${mousePos.x}px ${mousePos.y}px, rgba(234, 88, 12, ${cursorOpacity}), transparent 40%)`,
          opacity: mousePos.x ? 1 : 0 
        }} 
      />

      {/* Subtle dot grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: Math.max(dotOpacity, 0.05), backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Scroll-reactive warm ambient glow at bottom of viewport */}
      {scrollProgress > 0.05 && (
        <div
          className="fixed bottom-0 left-0 right-0 pointer-events-none z-[1]"
          style={{
            height: `${10 + scrollProgress * 30}%`,
            background: `linear-gradient(to top, rgba(234, 88, 12, ${scrollProgress * 0.06}), transparent)`,
            transition: 'height 0.4s ease-out, background 0.4s ease-out'
          }}
        />
      )}

      <NavBar onHome={() => navigate('/')} />
      
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={
            <main className="relative z-10">
              <LandingPage onStart={() => navigate('/analysis')} />
            </main>
          } />
          <Route path="/analysis" element={
            <main className="max-w-7xl mx-auto px-6 py-12 pt-28 relative z-10">
              <AnalysisPage 
                images={images} 
                setImages={setImages} 
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                analysisResult={analysisResult}
                setAnalysisResult={setAnalysisResult}
              />
            </main>
          } />
          <Route path="/report" element={
            <main className="max-w-7xl mx-auto px-6 py-12 pt-28 relative z-10">
              <ReportPage 
                analysisResult={analysisResult}
                selectedModel={selectedModel}
                onReset={() => {
                  setImages(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, before: null, after: null, activePreset: null })));
                  setAnalysisResult(null);
                  navigate('/analysis');
                }} 
              />
            </main>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}