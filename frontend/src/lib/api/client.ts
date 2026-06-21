import axios from "axios";

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:9090/api/v1`;
  }
  return "http://localhost:9090/api/v1";
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mrt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap data, handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mrt_token");
        localStorage.removeItem("mrt_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract data from {success, message, data} wrapper
export function unwrapData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}
