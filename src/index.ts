import { LiobaseSDK } from './client';

export const liobase = new LiobaseSDK();

export default liobase;


// Export types and errors for developers
export { ApiError } from './errors';
export * from './types';