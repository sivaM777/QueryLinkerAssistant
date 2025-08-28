import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link as LinkIcon, Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa";
import { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { email, password, rememberMe });
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
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                    <LinkIcon className="text-white text-lg" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">QueryLinker</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back :)</h1>
                <p className="text-gray-600 text-sm">
                  To keep connected with us please login with your personal information by email address and password 🔐
                </p>
              </div>

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-4">
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
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                  data-testid="button-login"
                >
                  Login Now
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
                    Don't have an account? {" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
                      Create Account
                    </a>
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