import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaApple, FaGoogle } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link2Icon } from "lucide-react";

const handleLogin = () => {
  window.location.href = "/api/login";
};

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
              <Link2Icon className="text-white text-xl" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QueryLinker</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">AI-Powered ITSM</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Create a QueryLinker account
            </h2>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 transition-colors"
              onClick={handleLogin}
              data-testid="continue-google"
            >
              <FaGoogle className="w-5 h-5 mr-3 text-red-500" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Continue with Google</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 transition-colors"
              onClick={handleLogin}
              data-testid="continue-apple"
            >
              <FaApple className="w-5 h-5 mr-3 text-gray-700 dark:text-gray-200" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Continue with Apple</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 transition-colors"
              onClick={handleLogin}
              data-testid="continue-twitter"
            >
              <FaXTwitter className="w-5 h-5 mr-3 text-gray-700 dark:text-gray-200" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Continue with X</span>
            </Button>

            {/* Divider */}
            <div className="relative py-4">
              <Separator className="bg-gray-200 dark:bg-slate-600" />
              <div className="absolute inset-0 flex justify-center items-center">
                <span className="bg-white dark:bg-slate-900 px-3 text-sm text-gray-500 dark:text-slate-400">
                  Or
                </span>
              </div>
            </div>

            {/* Email Option */}
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 transition-colors"
              onClick={handleLogin}
              data-testid="email-password"
            >
              <span className="text-gray-700 dark:text-gray-200 font-medium">📧 Email & password</span>
            </Button>

            <div className="relative py-2">
              <Separator className="bg-gray-200 dark:bg-slate-600" />
              <div className="absolute inset-0 flex justify-center items-center">
                <span className="bg-white dark:bg-slate-900 px-3 text-sm text-gray-500 dark:text-slate-400">
                  Or
                </span>
              </div>
            </div>

            {/* SSO Option */}
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 transition-colors"
              onClick={handleLogin}
              data-testid="sso-option"
            >
              <span className="text-gray-700 dark:text-gray-200 font-medium">🔗 Single sign-on (SSO)</span>
            </Button>

            {/* Terms */}
            <div className="pt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                By continuing, you agree to QueryLinker's{" "}
                <button className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>

            {/* Sign In Link */}
            <div className="pt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Already have an account?{" "}
                <button 
                  onClick={handleLogin}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  data-testid="log-in-link"
                >
                  Log in
                </button>
              </p>
            </div>

            {/* Help Link */}
            <div className="text-center">
              <button className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:underline">
                Get help
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            This site is protected by reCAPTCHA Enterprise and the Google{" "}
            <button className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </button>{" "}
            and{" "}
            <button className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </button>{" "}
            apply.
          </p>
        </div>
      </div>
    </div>
  );
}