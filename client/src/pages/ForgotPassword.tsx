import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      toast({
        title: "Verification Code Sent",
        description: "Check your email for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your email address",
      });
      return;
    }
    
    forgotPasswordMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-cyan-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden relative p-8">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <button
                onClick={() => setLocation('/login')}
                className="flex items-center mb-6 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </button>
              
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <LinkIcon className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold text-gray-800">QueryLinker</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600 text-sm">
                No worries! Enter your email address and we'll send you a verification code to reset your password 🔐
              </p>
            </div>

            {/* Forgot Password form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {forgotPasswordMutation.isPending 
                  ? "Sending..." 
                  : "Send Verification Code"
                }
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-sm text-gray-600">
                Remember your password? 
                <button
                  type="button"
                  onClick={() => setLocation('/login')}
                  className="text-blue-600 hover:text-blue-800 font-semibold ml-1"
                >
                  Login
                </button>
              </span>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              We've sent a verification code to <strong>{email}</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📧 Check your inbox!</strong><br />
                Your 6-digit verification code should arrive within a few minutes. Don't forget to check your spam folder.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setLocation(`/verify-reset-code?email=${encodeURIComponent(email)}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
              >
                Enter Verification Code
              </Button>
              
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
              >
                Didn't receive the email? Try again
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}