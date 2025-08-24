import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Try both Replit auth and email auth
  const { data: replitUser, isLoading: replitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  const { data: emailUser, isLoading: emailLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = replitUser || emailUser?.user;
  const isLoading = replitLoading || emailLoading;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
