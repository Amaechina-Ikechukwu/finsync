import { auth } from '@/firebase';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Optional per-request config
export interface RequestConfig {
  timeout?: number; // override client timeout (ms)
  headers?: Record<string, string>; // additional headers
  signal?: AbortSignal; // external abort controller
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
      ...config.headers,
    };
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken(true);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isFormData: boolean = false,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      // Only apply JSON headers if NOT sending FormData
      const headers: Record<string, string> = isFormData
        ? { ...(config?.headers || {}) }
        : { ...this.defaultHeaders, ...options.headers, ...(config?.headers || {}) };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutMs = Math.max(0, config?.timeout ?? this.timeout);
      const onExternalAbort = () => controller.abort();
      if (config?.signal) {
        if (config.signal.aborted) controller.abort();
        else config.signal.addEventListener('abort', onExternalAbort);
      }
      const timeoutId = timeoutMs
        ? setTimeout(() => controller.abort(), timeoutMs)
        : (undefined as unknown as ReturnType<typeof setTimeout>);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);
      if (config?.signal) config.signal.removeEventListener('abort', onExternalAbort);

      if (!response.ok) {
        let serverMessage = '';
        try {
          const errJson = await response.clone().json();
          serverMessage = errJson?.message || errJson?.error || '';
        } catch (_) {
          const errorText = await response.text();
          serverMessage = errorText;
        }
        console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`, serverMessage);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}${serverMessage ? ' - ' + serverMessage : ''}`,
          message: serverMessage || undefined,
        };
      }

      const data = await response.json();
      if (__DEV__) {
        // Lightweight dev-only trace of endpoint success
        console.log('✅ API', endpoint, 'OK');
      }
      return data;
    } catch (error: any) {
      console.error(`❌ API Error [${endpoint}]:`, error);
      const isAbort = error?.name === 'AbortError' || /aborted?/i.test(String(error?.message));
      return {
        success: false,
        error: isAbort ? 'Aborted' : error?.message || 'Network error occurred',
        message: isAbort ? 'Request timed out or was canceled' : undefined,
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    let urlPath = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, String(params[key]));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        urlPath += `?${queryString}`;
      }
    }

    return this.request<T>(urlPath, { method: 'GET' }, false, config);
  }

  async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      false,
      config
    );
  }

  async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      false,
      config
    );
  }

  async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      false,
      config
    );
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, false, config);
  }

  // ✅ FIXED: Proper multipart/form-data POST
  async postForm<T>(endpoint: string, form: FormData, config?: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      const headers: Record<string, string> = { ...(config?.headers || {}) };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutMs = Math.max(0, config?.timeout ?? this.timeout);
      const timeoutId = timeoutMs
        ? setTimeout(() => controller.abort(), timeoutMs)
        : (undefined as unknown as ReturnType<typeof setTimeout>);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers, // <-- do not set Content-Type manually
        body: form,
        signal: config?.signal ?? controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ postForm Error ${response.status}: ${response.statusText}`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ postForm Error [${endpoint}]:`, error);
      return {
        success: false,
        error: (error?.name === 'AbortError' || /aborted?/i.test(String(error?.message)))
          ? 'Aborted'
          : error?.message || 'Form upload error occurred',
      };
    }
  }

  async batch(
    requests: Array<{ endpoint: string; method: string; body?: any }>
  ): Promise<ApiResponse<any[]>> {
    try {
      const results = await Promise.all(
        requests.map((req) => {
          switch (req.method.toUpperCase()) {
            case 'GET':
              return this.get(req.endpoint);
            case 'POST':
              return this.post(req.endpoint, req.body);
            case 'PUT':
              return this.put(req.endpoint, req.body);
            case 'PATCH':
              return this.patch(req.endpoint, req.body);
            case 'DELETE':
              return this.delete(req.endpoint);
            default:
              throw new Error(`Unsupported method: ${req.method}`);
          }
        })
      );

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Batch request error occurred',
      };
    }
  }
}

// ✅ Default instance
const apiClient = new ApiClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://your-fallback-api-url.com/api',
  timeout: 45000,
});

export default apiClient;
