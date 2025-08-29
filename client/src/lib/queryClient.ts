import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    let errorMessage = res.statusText;
    
    try {
      if (contentType.includes('application/json')) {
        const json = await res.json();
        errorMessage = json.message || json.error || res.statusText;
      } else {
        const text = await res.text();
        // If it's HTML, extract just the error part, not the full HTML
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorMessage = 'Server error occurred';
        } else {
          errorMessage = text.substring(0, 200); // Limit error message length
        }
      }
    } catch (parseError) {
      errorMessage = res.statusText || 'Unknown error occurred';
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: any; // Accept any body type
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
