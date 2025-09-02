import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract email and code from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const codeParam = urlParams.get('code');
    
    if (emailParam && codeParam) {
      setEmail(decodeURIComponent(emailParam));
      setCode(decodeURIComponent(codeParam));
    } else {
      setLocation('/forgot-password');
    }
  }, [setLocation]);

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, code, newPassword }: { email: string; code: string; newPassword: string }) => {
      const response = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { email, code, newPassword },
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
        title: "Password Reset Successful",
        description: "Your password has been changed successfully. You can now log in.",
      });
      setLocation('/login');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password",
      });
    },
  });

  const getPasswordStrength = (password: string) => {
    if (password.length < 8) return { level: 'weak', text: 'Use at least 8 characters' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { level: 'medium', text: 'Add numbers and mixed case letters for strength' };
    }
    return { level: 'strong', text: 'Strong password' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
      });
      return;
    }
    
    resetPasswordMutation.mutate({ email, code, newPassword });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-sm border border-gray-200 rounded-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setLocation(`/verify-reset-code?email=${encodeURIComponent(email)}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-6"
            data-testid="button-back"
          >
            <ArrowLeft size={20} className="mr-2" />
          </button>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Password
          </h1>
          
          <p className="text-gray-600 text-sm mb-1">
            Choose a strong password and don't reuse it for other accounts.
          </p>
          
          <button
            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
            onClick={() => window.open('https://support.google.com/accounts/answer/32040', '_blank')}
          >
            Learn more
            <svg className="ml-1 w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="1"/>
              <circle cx="6" cy="3" r="1"/>
              <circle cx="6" cy="9" r="1"/>
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            You may be signed out of your account on some devices. <a href="#" className="text-blue-600 hover:text-blue-800">Learn more about where you'll stay signed in</a>
            <svg className="ml-1 w-3 h-3 inline" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="1"/>
              <circle cx="6" cy="3" r="1"/>
              <circle cx="6" cy="9" r="1"/>
            </svg>
          </p>
        </div>

        {/* Password Reset form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm text-blue-600 font-medium">
              New password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                required
                data-testid="input-new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Password strength:</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Use at least 8 characters. Don't use a password from another site, or something too obvious like your pet's name.{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 underline"
                      onClick={() => window.open('https://support.google.com/accounts/answer/32040', '_blank')}
                    >
                      Why?
                      <svg className="ml-1 w-3 h-3 inline" viewBox="0 0 12 12" fill="currentColor">
                        <circle cx="6" cy="6" r="1"/>
                        <circle cx="6" cy="3" r="1"/>
                        <circle cx="6" cy="9" r="1"/>
                      </svg>
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm text-gray-700">
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                required
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-change-password"
            >
              {resetPasswordMutation.isPending ? "Changing password..." : "Change password"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}