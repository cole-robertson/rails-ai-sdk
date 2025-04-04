// Global type definitions

// Define the route helper function
declare function route(name: string, params?: any): string;

// Extend Window interface
interface Window {
  route: typeof route;
} 