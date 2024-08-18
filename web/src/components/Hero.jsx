import React from 'react';

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">GitHub Action with AWS Bedrock</h1>
        <p className="text-xl md:text-2xl mb-8">Automated code reviews, PR generation, and issue operations using AWS Bedrock API</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-md text-lg font-semibold hover:bg-gray-100">
          Get Started
        </button>
      </div>
    </section>
  );
};

export default Hero;