import React from 'react';

const Hero = () => {
  return (
    <section className="bg-blue-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Intelli-Ops using AWS Bedrock</h2>
        <p className="text-xl mb-8">Automated code reviews, PR generation, and more with AI-powered GitHub Actions</p>
        <a href="#quickstart" className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-blue-100 transition duration-300">Get Started</a>
      </div>
    </section>
  );
};

export default Hero;