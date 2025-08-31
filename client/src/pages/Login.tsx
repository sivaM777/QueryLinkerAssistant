import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link as LinkIcon, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa";
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Store user data from login response
      if (data && data.user) {
        setUser(data.user);
      }
      toast({
        title: "Login Successful",
        description: "Welcome back to QueryLinker!",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or incorrect password",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: userData,
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Account created! Please login with your credentials.",
      });
      setIsSignup(false);
      // Clear signup fields
      setFirstName("");
      setLastName("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create account",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignup) {
      if (!firstName || !lastName || !email || !password) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields",
        });
        return;
      }
      registerMutation.mutate({ email, password, firstName, lastName });
    } else {
      if (!email || !password) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter your email and password",
        });
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Handle social login
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-cyan-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Card className="w-full max-w-5xl bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden relative">
        <div className="flex min-h-[600px]">
          {/* Left side - Illustration */}
          <div className="flex-1 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 p-12 flex items-center justify-center relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-8 h-8 border-2 border-white/30 rounded rotate-45"></div>
              <div className="absolute top-40 right-32 w-6 h-6 bg-white/20 rounded-full"></div>
              <div className="absolute bottom-32 left-16 w-4 h-4 bg-white/25 rounded-full"></div>
              <div className="absolute bottom-40 right-20 w-12 h-12 border-2 border-white/20 rounded-full"></div>
            </div>

            {/* Illustration - Simple geometric representation */}
            <div className="relative z-10 text-center">
              <div className="mb-8">
                {/* Desk/counter illustration */}
                <div className="relative">
                  {/* People figures */}
                  <div className="flex items-end justify-center mb-4 space-x-8">
                    {/* Person 1 */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-300 rounded-full mb-2 relative">
                        <div className="absolute top-2 left-4 w-2 h-2 bg-black/70 rounded-full"></div>
                        <div className="absolute top-2 right-4 w-2 h-2 bg-black/70 rounded-full"></div>
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/50 rounded-full"></div>
                      </div>
                      <div className="w-12 h-20 bg-orange-400 rounded-t-xl mx-auto"></div>
                    </div>

                    {/* Person 2 */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-300 rounded-full mb-2 relative">
                        <div className="absolute top-2 left-4 w-2 h-2 bg-black/70 rounded-full"></div>
                        <div className="absolute top-2 right-4 w-2 h-2 bg-black/70 rounded-full"></div>
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/50 rounded-full"></div>
                        <div className="absolute -bottom-4 -left-2 -right-2 h-8 bg-black/80 rounded"></div>
                      </div>
                      <div className="w-12 h-20 bg-pink-400 rounded-t-xl mx-auto"></div>
                    </div>
                  </div>

                  {/* Desk/Counter */}
                  <div className="relative">
                    <div className="w-64 h-24 bg-cyan-300 rounded-t-3xl mx-auto shadow-lg"></div>
                    <div className="w-72 h-8 bg-cyan-400 rounded-full mx-auto -mt-2 shadow-inner"></div>
                    
                    {/* Plant decoration */}
                    <div className="absolute right-8 -top-8">
                      <div className="w-8 h-12 bg-green-400 rounded-full"></div>
                      <div className="w-6 h-6 bg-yellow-300 rounded-full mx-auto -mt-2"></div>
                    </div>
                  </div>

                  {/* Base/Floor */}
                  <div className="w-80 h-4 bg-white/30 rounded-full mx-auto mt-4"></div>
                </div>
              </div>

              <div className="text-white space-y-2">
                <h2 className="text-2xl font-bold">Welcome to QueryLinker</h2>
                <p className="text-white/80 text-sm max-w-xs mx-auto">
                  Streamline your IT operations with intelligent automation and seamless integrations
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="flex-1 p-12 flex items-center justify-center">
            <div className="w-full max-w-sm">
              {/* Header */}
              <div className="text-center mb-8">
                {isSignup && (
                  <button
                    onClick={() => setIsSignup(false)}
                    className="flex items-center mb-4 text-gray-600 hover:text-gray-800 transition-colors"
                    data-testid="button-back-to-login"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Login
                  </button>
                )}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                    <LinkIcon className="text-white text-lg" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">QueryLinker</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {isSignup ? "Create Account" : "Welcome Back :)"}
                </h1>
                <p className="text-gray-600 text-sm">
                  {isSignup 
                    ? "Join QueryLinker to streamline your IT operations with intelligent automation 🚀"
                    : "To keep connected with us please login with your personal information by email address and password 🔐"
                  }
                </p>
              </div>

              {/* Authentication form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-firstName"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm text-gray-700">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-lastName"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="John@company.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-email"
                  />
                  <div className="flex items-center text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Remember Me</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="•••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      data-testid="toggle-password"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Remember Me</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      data-testid="checkbox-remember"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember Me</label>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setLocation('/forgot-password')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  data-testid={isSignup ? "button-register" : "button-login"}
                >
                  {loginMutation.isPending || registerMutation.isPending 
                    ? "Please wait..." 
                    : (isSignup ? "Create Account" : "Login Now")
                  }
                </Button>
              </form>

              <div className="mt-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-sm text-gray-500">Or you can join with</span>
                </div>

                {/* Social login buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex-1 flex items-center justify-center py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="button-google"
                  >
                    <FaGoogle className="text-red-500 text-lg" />
                  </button>
                  <button
                    onClick={() => handleSocialLogin('Facebook')}
                    className="flex-1 flex items-center justify-center py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="button-facebook"
                  >
                    <FaFacebook className="text-blue-600 text-lg" />
                  </button>
                  <button
                    onClick={() => handleSocialLogin('Twitter')}
                    className="flex-1 flex items-center justify-center py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="button-twitter"
                  >
                    <FaTwitter className="text-blue-400 text-lg" />
                  </button>
                </div>

                <div className="text-center mt-6">
                  <span className="text-sm text-gray-600">
                    {isSignup ? "Already have an account? " : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(!isSignup)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                      data-testid="button-toggle-signup"
                    >
                      {isSignup ? "Login" : "Create Account"}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}