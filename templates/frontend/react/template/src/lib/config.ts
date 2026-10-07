// Falls back to the URL this project was generated with, so `npm run dev`
// works immediately without first copying .env.example to .env.
export const API_URL: string = import.meta.env.VITE_API_URL ?? '{{apiUrl}}';

export const APP_NAME = '{{projectName}}';
