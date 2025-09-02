import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VerifyResetCode() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract email from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      setLocation('/forgot-password');
    }
  }, [setLocation]);

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const response = await apiRequest('/api/auth/verify-reset-code', {
        method: 'POST',
        body: { email, code },
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code Verified",
        description: "Your code is valid. You can now create a new password.",
      });
      // Redirect to password reset page with verified email and code
      setLocation(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: error.message || "The verification code is invalid or has expired",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
      });
      return;
    }
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Email is required for verification",
      });
      return;
    }
    
    verifyCodeMutation.mutate({ email, code });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-cyan-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden relative p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setLocation('/forgot-password')}
            className="flex items-center mb-6 text-gray-600 hover:text-gray-800 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <LinkIcon className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-800">QueryLinker</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Enter Verification Code
          </h1>
          <p className="text-gray-600 text-sm">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {/* Verification Code form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm text-gray-700">Verification Code</Label>
            <div className="relative">
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={handleCodeChange}
                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                required
                data-testid="input-code"
              />
              <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <Button
            type="submit"
            disabled={verifyCodeMutation.isPending || code.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            data-testid="button-verify"
          >
            {verifyCodeMutation.isPending 
              ? "Verifying..." 
              : "Verify Code"
            }
          </Button>
        </form>

        {/* Resend code section */}
        <div className="text-center mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>⏰ Code expires in 10 minutes</strong><br />
              Make sure to use it before it expires.
            </p>
          </div>
          
          <span className="text-sm text-gray-600">
            Didn't receive the code? 
            <button
              type="button"
              onClick={() => setLocation('/forgot-password')}
              className="text-blue-600 hover:text-blue-800 font-semibold ml-1"
              data-testid="button-resend"
            >
              Send again
            </button>
          </span>
        </div>
      </Card>
    </div>
  );
}