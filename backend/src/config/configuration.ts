export default () => ({
  port: Number(process.env.PORT ?? 3001),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
    publicUploadBaseUrl: process.env.PUBLIC_UPLOAD_BASE_URL ?? 'http://localhost:3001/api/uploads',
  },
});
