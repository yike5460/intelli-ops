import React from 'react';

function Features() {
  const features = [
    { title: 'AI-Powered', description: 'Leverage cutting-edge AI technology' },
    { title: 'Easy Integration', description: 'Seamlessly integrate with your existing tools' },
    { title: 'Boost Productivity', description: 'Increase your team\'s efficiency' },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;