import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001/api" : "/api"),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ApiResponse<T> = { data: T };

// Auth
export const register = (email: string, password: string) => api.post("/auth/register", { email, password });
export const login = (email: string, password: string) => api.post("/auth/login", { email, password });

// Surveys
export const getSurveys = () => api.get("/surveys");
export const getSurvey = (id: string) => api.get(`/surveys/${id}`);
export const getSurveyBySlug = (slug: string) => api.get(`/surveys/slug/${slug}`);
export const createSurvey = (payload: { title: string; description?: string; schema?: unknown[]; status?: string }) =>
  api.post("/surveys", payload);
export const updateSurvey = (
  id: string,
  payload: { title: string; description?: string; schema?: unknown[]; status?: string },
) => api.put(`/surveys/${id}`, payload);
export const publishSurvey = (id: string) => api.patch(`/surveys/${id}/publish`);
export const deleteSurvey = (id: string) => api.delete(`/surveys/${id}`);

// Responses
export const submitResponse = (surveyId: string, payload: { answers: Record<string, unknown>; isPartial?: boolean }) =>
  api.post(`/surveys/${surveyId}/responses`, payload);
export const getResponses = (surveyId: string) => api.get(`/surveys/${surveyId}/responses`);

// Analytics
export const getAnalytics = (surveyId: string) => api.get(`/surveys/${surveyId}/analytics`);

export default api;

