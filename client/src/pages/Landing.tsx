import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, Search, BarChart3, Shield, Zap, Users } from "lucide-react";
import { useLocation } from "wouter";
import Silk from "@/components/Silk";
import TextType from "@/components/TextType";
import "@/components/TextType.css";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleLogin = () => {
    setLocation("/login");
  };

  const handleGetStarted = () => {
    setLocation("/login");
  };

  return (
    <Silk 
      className="min-h-screen"
      speed={0.8}
      scale={1.5}
      color="#8b5cf6"
      noiseIntensity={1.2}
    >
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
              <LinkIcon className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">QueryLinker</h1>
              <p className="text-xs text-slate-400">AI-Powered ITSM</p>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium px-6 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
            data-testid="login-button"
          >
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6">
        <div className="text-center py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <TextType
                text={[
                  "AI-Powered IT Service Management",
                  "Intelligent System Integration", 
                  "Automated Workflow Solutions"
                ]}
                typingSpeed={80}
                deletingSpeed={50}
                pauseDuration={3000}
                className="inline-block"
                textColors={["#ffffff", "#60a5fa", "#a78bfa"]}
              />
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 mt-4">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Streamline your IT operations with intelligent search, automated workflows, and comprehensive analytics. Connect all your systems in one unified platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                data-testid="get-started-button"
              >
                Get Started Free
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium px-8 py-4 rounded-xl transition-all duration-200"
                data-testid="learn-more-button"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features for Modern IT Teams
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Everything you need to manage, monitor, and optimize your IT services in one intelligent platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-white">AI-Powered Search</CardTitle>
                <CardDescription className="text-slate-300">
                  Find solutions instantly across Jira, Confluence, GitHub, and ServiceNow with intelligent ranking and contextual suggestions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-white">Advanced Analytics</CardTitle>
                <CardDescription className="text-slate-300">
                  Get deep insights into system performance, user behavior, and resolution patterns with interactive dashboards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-white">SLA Management</CardTitle>
                <CardDescription className="text-slate-300">
                  Monitor service levels, track compliance, and get proactive alerts for potential breaches with automated escalation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-white">Real-time Sync</CardTitle>
                <CardDescription className="text-slate-300">
                  Keep your knowledge base current with automated synchronization and real-time updates from all connected systems.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-white">Team Collaboration</CardTitle>
                <CardDescription className="text-slate-300">
                  Enable seamless collaboration with shared knowledge, comments, and real-time notifications across your team.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LinkIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-white">System Integration</CardTitle>
                <CardDescription className="text-slate-300">
                  Connect with popular tools like Jira, Confluence, GitHub, and ServiceNow through secure OAuth integrations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <Card className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary to-purple-600 border-0 shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your IT Operations?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of IT teams who trust QueryLinker to streamline their workflows and improve service delivery.
              </p>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 font-medium px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                data-testid="cta-button"
              >
                Start Your Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-slate-700/30">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 QueryLinker. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </Silk>
  );
}
