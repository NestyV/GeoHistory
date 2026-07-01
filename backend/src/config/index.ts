/**
 * Environment and configuration management
 * All environment variables validated and typed here
 * See specs/Operations.md § 1.3 for environment variable reference
 */

import { config as dotenvConfig } from 'dotenv';

// Load .env file
dotenvConfig();

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ? parseInt(value, 10) : defaultValue || 0;
};

const getEnvBoolean = (key: string, defaultValue = false): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

export const config = {
  // Node environment
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
  isProduction: getEnvVar('NODE_ENV', 'development') === 'production',

  // Server
  port: getEnvNumber('PORT', 3001),
  apiBaseUrl: getEnvVar('API_BASE_URL', 'http://localhost:3001'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),

  // Database
  database: {
    url: getEnvVar('DATABASE_URL'),
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    user: getEnvVar('DB_USER', 'postgres'),
    password: getEnvVar('DB_PASSWORD', 'postgres'),
    name: getEnvVar('DB_NAME', 'geohistory'),
  },

  // JWT Authentication (See specs/Security.md § 1.1)
  jwt: {
    accessSecret: getEnvVar('JWT_SECRET'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
    accessExpiresIn: getEnvVar('JWT_ACCESS_EXPIRY', '15m'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRY', '7d'),
  },

  // Rate Limiting (See specs/Security.md § 2.3)
  rateLimit: {
    enabled: getEnvBoolean('RATE_LIMIT_ENABLED', true),
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    sensitiveEndpointLimit: getEnvNumber('RATE_LIMIT_SENSITIVE_MAX', 10),
  },

  // Logging (See specs/Operations.md § 4)
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'json'),
  },

  // CORS
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: getEnvBoolean('CORS_CREDENTIALS', true),
  },

  // Optional services
  email: {
    enabled: getEnvBoolean('EMAIL_ENABLED', false),
    provider: getEnvVar('EMAIL_PROVIDER', 'smtp'),
    from: getEnvVar('EMAIL_FROM', ''),
  },

  fileUpload: {
    enabled: getEnvBoolean('FILE_UPLOAD_ENABLED', true),
    maxSize: getEnvNumber('FILE_UPLOAD_MAX_SIZE', 5 * 1024 * 1024), // 5MB
    uploadDir: getEnvVar('FILE_UPLOAD_DIR', './uploads'),
  },
} as const;

// ============================================================================
// TYPE-SAFE EXPORTS
// ============================================================================

export type Config = typeof config;

// Validate critical config on startup
export const validateConfig = (): void => {
  const required = ['database.url', 'jwt.accessSecret', 'jwt.refreshSecret'];
  const missing: string[] = [];

  for (const path of required) {
    const [section, key] = path.split('.');
    if (!section || !key) {
      missing.push(path);
      continue;
    }

    let value: unknown;
    if (section === 'database' && (key === 'url' || key === 'host' || key === 'port' || key === 'user' || key === 'password' || key === 'name')) {
      value = config.database[key];
    } else if (section === 'jwt' && (key === 'accessSecret' || key === 'refreshSecret' || key === 'accessExpiresIn' || key === 'refreshExpiresIn')) {
      value = config.jwt[key];
    }

    if (!value) {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};
