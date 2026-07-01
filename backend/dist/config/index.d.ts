/**
 * Environment and configuration management
 * All environment variables validated and typed here
 * See specs/Operations.md § 1.3 for environment variable reference
 */
export declare const config: {
    readonly nodeEnv: string;
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly port: number;
    readonly apiBaseUrl: string;
    readonly frontendUrl: string;
    readonly database: {
        readonly url: string;
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly name: string;
    };
    readonly jwt: {
        readonly accessSecret: string;
        readonly refreshSecret: string;
        readonly accessExpiresIn: string;
        readonly refreshExpiresIn: string;
    };
    readonly rateLimit: {
        readonly enabled: boolean;
        readonly windowMs: number;
        readonly maxRequests: number;
        readonly sensitiveEndpointLimit: number;
    };
    readonly logging: {
        readonly level: string;
        readonly format: string;
    };
    readonly cors: {
        readonly origin: string;
        readonly credentials: boolean;
    };
    readonly email: {
        readonly enabled: boolean;
        readonly provider: string;
        readonly from: string;
    };
    readonly fileUpload: {
        readonly enabled: boolean;
        readonly maxSize: number;
        readonly uploadDir: string;
    };
};
export type Config = typeof config;
export declare const validateConfig: () => void;
//# sourceMappingURL=index.d.ts.map