export default function configuration() {
  return {
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    database: {
      url: process.env.DATABASE_URL ?? null,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'prospect_pulse',
      password: process.env.DB_PASSWORD ?? 'prospect_pulse',
      database: process.env.DB_DATABASE ?? 'prospect_pulse',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
    },
  };
}
