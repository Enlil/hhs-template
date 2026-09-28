export interface AppConfig {
  port: number;
  corsOrigin: string;
}

// Falls back to the values this project was generated with, so `npm run dev`
// works immediately without first copying .env.example to .env.
export default (): AppConfig => ({
  port: Number(process.env.PORT) || {{backendPort}},
  corsOrigin: process.env.CORS_ORIGIN || '{{frontendUrl}}',
});
