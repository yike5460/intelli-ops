import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import QuickStart from './components/QuickStart';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Hero />
      <Features />
      <QuickStart />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

export default App;