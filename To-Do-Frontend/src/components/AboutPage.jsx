import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const features = [
    {
      icon: "📝",
      title: "Smart Task Management",
      description: "Create, organize, and track your tasks with intuitive date scheduling and priority management."
    },
    {
      icon: "👥",
      title: "Group Collaboration",
      description: "Work together with shared groups and real-time collaboration features for team productivity."
    },
    {
      icon: "🤖",
      title: "AI Assistant",
      description: "Get intelligent task suggestions and productivity insights from our built-in AI chatbot."
    },
    {
      icon: "🔔",
      title: "Smart Notifications",
      description: "Stay on top of your tasks with email notifications and real-time updates."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your data is protected with secure authentication and encrypted storage."
    },
    {
      icon: "📱",
      title: "Cross-Platform",
      description: "Access your tasks anywhere with our responsive web application."
    }
  ];

  const teamMembers = [
    {
      name: "Development Team",
      role: "Full-Stack Development",
      description: "Passionate developers creating innovative productivity solutions."
    },
    {
      name: "Design Team",
      role: "UI/UX Design",
      description: "Crafting beautiful and intuitive user experiences."
    },
    {
      name: "AI Team",
      role: "AI Integration",
      description: "Building intelligent features to enhance productivity."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
              <span className="text-4xl">📝</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              About To-Do App
            </h1>
            <p className="text-xl sm:text-2xl text-white opacity-90 max-w-3xl mx-auto mb-8">
              Empowering productivity through intelligent task management and seamless collaboration
            </p>
            <div className="inline-flex items-center bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold">
              <span className="animate-pulse mr-2">✨</span>
              Currently in Beta - v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We believe that productivity shouldn't be complicated. Our mission is to create a simple, 
              powerful, and intelligent task management platform that helps individuals and teams achieve 
              their goals efficiently. Whether you're managing personal tasks or collaborating with a team, 
              our app adapts to your workflow and grows with your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Simplicity</h3>
              <p className="text-gray-600">
                Clean, intuitive design that gets out of your way so you can focus on what matters most.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Efficiency</h3>
              <p className="text-gray-600">
                Smart features and AI assistance to help you work faster and accomplish more.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Collaboration</h3>
              <p className="text-gray-600">
                Seamless team collaboration with shared groups and real-time updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the tools and features that make our To-Do app the perfect productivity companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">Our Team</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Meet the passionate team behind To-Do App, dedicated to creating the best productivity experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">👨‍💻</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-indigo-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">Built with Modern Technology</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We use cutting-edge technologies to ensure the best performance, security, and user experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "React", icon: "⚛️" },
              { name: "Node.js", icon: "🟢" },
              { name: "MongoDB", icon: "🍃" },
              { name: "Socket.IO", icon: "🔌" },
              { name: "AI/ML", icon: "🤖" },
              { name: "Tailwind CSS", icon: "🎨" },
              { name: "JWT Auth", icon: "🔐" },
              { name: "Email Service", icon: "📧" }
            ].map((tech, index) => (
              <div key={index} className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">{tech.icon}</div>
                <p className="text-sm font-medium text-gray-800">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Beta Notice */}
      <div className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Beta Version Notice</h3>
            <p className="text-white opacity-90 mb-6 leading-relaxed">
              You're using the beta version of our To-Do App! We're continuously improving and adding new features. 
              Your feedback is invaluable in helping us create the best possible experience. Please report any issues 
              or share your suggestions through our feedback system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/feedback"
                className="bg-white text-orange-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                📝 Give Feedback
              </Link>
              <Link
                to="/contact"
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                📞 Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 sm:py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Join thousands of users who are already managing their tasks more efficiently with our app
          </p>
          <Link
            to="/"
            className="inline-flex items-center bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            <span className="mr-2">🚀</span>
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;