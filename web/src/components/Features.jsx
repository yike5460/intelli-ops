import React from 'react';

const Feature = ({ title, description, icon }) => (
  <div className="flex flex-col items-center text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <Feature
            icon="🔍"
            title="Automated Code Reviews"
            description="Perform automated code reviews on pull requests using AWS Bedrock API."
          />
          <Feature
            icon="📝"
            title="PR Description Generation"
            description="Automatically generate pull request descriptions for better context."
          />
          <Feature
            icon="🧪"
            title="Unit Test Suite Generation"
            description="Generate unit test suites to improve code quality and coverage."
          />
        </div>
      </div>
    </section>
  );
};

export default Features;