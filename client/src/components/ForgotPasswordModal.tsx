import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Key, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'token' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      setStep('token');
    },
    onError: (error) => {
      console.error('Forgot password error:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      return await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (error) => {
      console.error('Reset password error:', error);
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      forgotPasswordMutation.mutate(email);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (token && newPassword) {
      resetPasswordMutation.mutate({ token, newPassword });
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setToken('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'email' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('email')}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Key className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && "Enter your email address to receive a password reset link."}
            {step === 'token' && "Check your email for the reset token and enter your new password."}
            {step === 'success' && "Your password has been successfully reset."}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="reset-email-input"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending || !email}
                  data-testid="send-reset-button"
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'token' && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  A password reset token has been sent to <strong>{email}</strong>. 
                  Check your email and enter the token below along with your new password.
                </p>
              </div>
              
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-token">Reset Token</Label>
                  <Input
                    id="reset-token"
                    placeholder="Enter the token from your email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    data-testid="reset-token-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    data-testid="new-password-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="confirm-new-password-input"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetPasswordMutation.isPending || !token || !newPassword || !confirmPassword}
                  data-testid="reset-password-button"
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Password Reset Successful
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <Button
                  onClick={handleClose}
                  className="w-full"
                  data-testid="close-success-button"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}