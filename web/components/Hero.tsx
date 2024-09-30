import React from 'react';

const Hero = () => {
  return (
    <section className="py-20 text-center bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          Elevate Your DevOps Pipeline with Generative AI
        </h2>
        <p className="text-xl mb-8 text-gray-600">Unleash the power of our AI-driven DevOps solution to streamline your workflows, boost productivity, and transform your IT landscape.</p>
        <div className="flex justify-center space-x-4">
          <a href="#quickstart" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition duration-300">Get Started</a>
          <a href="https://github.com/aws-samples/aws-genai-cicd-suite" target="_blank" rel="noopener noreferrer" className="bg-gray-200 text-gray-800 px-8 py-3 rounded-full font-bold hover:bg-gray-300 transition duration-300">It's Open Sourced!</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;