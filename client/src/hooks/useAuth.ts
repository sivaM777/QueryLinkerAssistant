import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Try both Replit auth and email auth
  const { data: replitUser, isLoading: replitLoading, error: replitError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
  });

  const { data: emailUser, isLoading: emailLoading, error: emailError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: true,
  });

  const user = replitUser || emailUser?.user;
  const isLoading = replitLoading || emailLoading;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
