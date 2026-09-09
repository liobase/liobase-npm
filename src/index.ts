import { LiobaseSDK } from './client';

export { LiobaseSDK };

export const liobase = new LiobaseSDK();
export default liobase;

// Export error classes and public interfaces
export { ApiError } from './errors';
export * from './types/types';