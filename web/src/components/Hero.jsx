import React from 'react';

function Hero() {
  return (
    <section className="bg-blue-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to YourProduct</h1>
        <p className="text-xl md:text-2xl mb-8">Revolutionize your workflow with our AI-powered solution</p>
        <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-blue-100 transition duration-300">
          Get Started
        </button>
      </div>
    </section>
  );
}

export default Hero;