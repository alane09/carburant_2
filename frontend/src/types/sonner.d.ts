/**
 * Type declarations for sonner package
 * This resolves TypeScript import compatibility issues
 */

declare module 'sonner' {
  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
    promise: <T>(promise: Promise<T>, messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }) => Promise<T>;
    dismiss: () => void;
    custom: (component: React.ReactNode) => void;
  };
}
