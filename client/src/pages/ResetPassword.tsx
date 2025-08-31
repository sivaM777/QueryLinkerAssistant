import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Verify token on component mount
  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ['verify-reset-token', token],
    queryFn: async () => {
      if (!token) throw new Error('No reset token found');
      
      const response = await apiRequest(`/api/auth/verify-reset-token/${token}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid token');
      }
      
      return await response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: data,
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in both password fields",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
      });
      return;
    }
    
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Reset Link",
        description: "Reset token is missing",
      });
      return;
    }
    
    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Reset Link",
        description: "This reset link is invalid or missing a token",
      });
      setLocation('/forgot-password');
    }
  }, [token, setLocation, toast]);

  if (!token) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden relative p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !tokenData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden relative p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={32} />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              This password reset link is invalid or has expired.
            </p>
            
            <Button
              onClick={() => setLocation('/forgot-password')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              Request New Reset Link
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-cyan-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden relative p-8">
        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <LinkIcon className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold text-gray-800">QueryLinker</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Reset Your Password
              </h1>
              <p className="text-gray-600 text-sm">
                Enter your new password below for <strong>{tokenData?.email}</strong> 🔐
              </p>
            </div>

            {/* Reset Password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-700">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-gray-700">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 mt-6"
              >
                {resetPasswordMutation.isPending 
                  ? "Updating Password..." 
                  : "Update Password"
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
              Password Updated!
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Your password has been successfully updated. You can now login with your new password.
            </p>
            
            <Button
              onClick={() => setLocation('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              Go to Login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}