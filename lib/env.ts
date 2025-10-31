/**
 * Environment validation utility
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  
  // OpenAI
  OPENAI_API_KEY: string;
  
  // Optional services
  CHATWOOT_BASE_URL?: string;
  CHATWOOT_ACCOUNT_ID?: string;
  CHATWOOT_API_KEY?: string;
  N8N_BASE_URL?: string;
  N8N_API_KEY?: string;
  FUSION_BASE_URL?: string;
  FUSION_API_KEY?: string;
  
  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  
  // App URLs
  NEXT_PUBLIC_BASE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  
  // Stripe (optional, only required if billing is enabled)
  STRIPE_SECRET_KEY?: string;
  STRIPE_SECRET_KEY_TEST?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET_TEST?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST?: string;
  STRIPE_BILLING_ENABLED?: string;
}

class EnvironmentValidator {
  private config: EnvConfig;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.validate();
  }

  private loadConfig(): EnvConfig {
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      CHATWOOT_BASE_URL: process.env.CHATWOOT_BASE_URL,
      CHATWOOT_ACCOUNT_ID: process.env.CHATWOOT_ACCOUNT_ID,
      CHATWOOT_API_KEY: process.env.CHATWOOT_API_KEY,
      N8N_BASE_URL: process.env.N8N_BASE_URL,
      N8N_API_KEY: process.env.N8N_API_KEY,
      FUSION_BASE_URL: process.env.FUSION_BASE_URL,
      FUSION_API_KEY: process.env.FUSION_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST,
      STRIPE_BILLING_ENABLED: process.env.STRIPE_BILLING_ENABLED,
    };
  }

  private validate(): void {
    // Required variables
    const required = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET', 
      'NEXTAUTH_URL',
      'OPENAI_API_KEY'
    ];

    for (const key of required) {
      if (!this.config[key as keyof EnvConfig]) {
        this.errors.push(`Missing required environment variable: ${key}`);
      }
    }

    // Validate URLs
    if (this.config.NEXTAUTH_URL && !this.isValidUrl(this.config.NEXTAUTH_URL)) {
      this.errors.push('NEXTAUTH_URL must be a valid URL');
    }

    if (this.config.CHATWOOT_BASE_URL && !this.isValidUrl(this.config.CHATWOOT_BASE_URL)) {
      this.errors.push('CHATWOOT_BASE_URL must be a valid URL');
    }

    if (this.config.N8N_BASE_URL && !this.isValidUrl(this.config.N8N_BASE_URL)) {
      this.errors.push('N8N_BASE_URL must be a valid URL');
    }

    if (this.config.FUSION_BASE_URL && !this.isValidUrl(this.config.FUSION_BASE_URL)) {
      this.errors.push('FUSION_BASE_URL must be a valid URL');
    }

    // Validate API keys format
    if (this.config.OPENAI_API_KEY && !this.config.OPENAI_API_KEY.startsWith('sk-')) {
      this.warnings.push('OPENAI_API_KEY should start with "sk-"');
    }

    // Check for development defaults
    if (this.config.NEXTAUTH_URL?.includes('localhost')) {
      this.warnings.push('Using localhost URL in production - update NEXTAUTH_URL');
    }

    if (this.config.NEXTAUTH_SECRET === 'your-secret-key' || this.config.NEXTAUTH_SECRET.length < 32) {
      this.errors.push('NEXTAUTH_SECRET must be a secure random string (32+ characters)');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public getConfig(): EnvConfig {
    return this.config;
  }

  public getErrors(): string[] {
    return this.errors;
  }

  public getWarnings(): string[] {
    return this.warnings;
  }

  public isValid(): boolean {
    return this.errors.length === 0;
  }

  public logStatus(): void {
    if (this.errors.length > 0) {
      console.error('❌ Environment validation failed:');
      this.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:');
      this.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (this.isValid()) {
      console.log('✅ Environment validation passed');
    }
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Export config for use throughout the app
export const env = envValidator.getConfig();

// Log validation status on import
if (process.env.NODE_ENV === 'development') {
  envValidator.logStatus();
}
