import "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _skipCache?: boolean;
    _noRedirect?: boolean;
    _noToast?: boolean;
    _retry?: boolean;
    _cachedResponse?: any;
  }
}
