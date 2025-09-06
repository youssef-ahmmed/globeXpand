import * as Joi from "joi";

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default("api/v1"),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),

  // MySQL
  MYSQL_HOST: Joi.string().default("localhost"),
  MYSQL_PORT: Joi.number().default(3306),
  MYSQL_DATABASE: Joi.string().required(),
  MYSQL_USERNAME: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  MYSQL_SYNCHRONIZE: Joi.boolean().default(false),
  MYSQL_LOGGING: Joi.boolean().default(true),

  // MongoDB
  MONGODB_URI: Joi.string().required(),

  // Mail
  MAIL_HOST: Joi.string().default("localhost"),
  MAIL_PORT: Joi.number().default(1025),
  MAIL_USER: Joi.string().allow(""),
  MAIL_PASSWORD: Joi.string().allow(""),
  MAIL_FROM: Joi.string().default("noreply@expanders360.com"),
  MAIL_TRANSPORT: Joi.string().default("smtp"),

  // Throttling
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Cache
  CACHE_TTL: Joi.number().default(300),

  // Matching
  MATCHING_SERVICE_WEIGHT: Joi.number().default(2),
  MATCHING_SLA_THRESHOLD_HOURS: Joi.number().default(24),
  MATCHING_SLA_WEIGHT: Joi.number().default(1),
  MATCHING_TOP_MATCHES_COUNT: Joi.number().default(3),

  // Scheduling
  CRON_MATCH_REFRESH: Joi.string().default("0 3 * * *"),
  CRON_SLA_CHECK: Joi.string().default("0 */6 * * *"),
  SCHEDULING_ENABLED: Joi.boolean().default(true),

  // Analytics
  ANALYTICS_DEFAULT_PERIOD_DAYS: Joi.number().default(30),
  ANALYTICS_CACHE_EXPIRY_MINUTES: Joi.number().default(15),
});
