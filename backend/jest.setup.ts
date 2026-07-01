process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/geohistory_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_access_secret_at_least_32_chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_chars';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com';
