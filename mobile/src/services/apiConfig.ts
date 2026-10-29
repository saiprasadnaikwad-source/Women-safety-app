// Dynamic backend API base URL resolver
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const getSocketUrl = (): string => {
  return getApiBaseUrl();
};
