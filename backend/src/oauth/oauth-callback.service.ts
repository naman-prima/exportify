import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OAuthCallbackService {
  private readonly logger = new Logger(OAuthCallbackService.name);
  private readonly apiBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private supabase: SupabaseService,
  ) {
    this.apiBaseUrl = this.configService.get<string>('RATIO_API_BASE_URL');
    this.clientId = this.configService.get<string>('RATIO_APP_ID', '');
    this.clientSecret = this.configService.get<string>('RATIO_APP_SECRET', '');
    this.redirectUri = this.configService.get<string>('RATIO_REDIRECT_URI', 'http://localhost:3000/callback');
  }

  /**
   * Exchange authorization code for access token.
   * Writes token to process.env (immediate) + .env file (persists across restarts).
   */
  async exchangeCodeForToken(code: string) {
    this.logger.log(`Exchanging authorization code for access token...`);

    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        redirectUri: this.redirectUri,
      });

      const data = response.data;

      // Update process.env immediately (hot-reload — no restart needed)
      process.env.RATIO_ACCESS_TOKEN = data.access_token;
      process.env.RATIO_REFRESH_TOKEN = data.refresh_token;
      process.env.RATIO_MERCHANT_ID = data.merchant_id;
      process.env.RATIO_SCOPES = data.scope;

      // Persist to .env file so it survives restarts
      this.writeToEnvFile({
        RATIO_ACCESS_TOKEN: data.access_token,
        RATIO_REFRESH_TOKEN: data.refresh_token,
        RATIO_MERCHANT_ID: data.merchant_id,
        RATIO_SCOPES: data.scope,
      });

      // Console output so the developer sees the token info
      console.log('\n' + '='.repeat(60));
      console.log('NEW MERCHANT INSTALLED YOUR APP!');
      console.log('='.repeat(60));
      console.log(`Merchant ID:    ${data.merchant_id}`);
      console.log(`Access Token:   ${data.access_token}`);
      console.log(`Refresh Token:  ${data.refresh_token}`);
      console.log(`Scopes:         ${data.scope}`);
      console.log('='.repeat(60));
      console.log('Token injected into process.env and .env file.');
      console.log('Your API routes are now live — no restart needed.');
      console.log('='.repeat(60) + '\n');

      // Save merchant to Supabase for multi-merchant support
      await this.supabase.upsertMerchant({
        merchant_id: data.merchant_id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        scopes: data.scope,
      });

      this.logger.log(`Token obtained for merchant: ${data.merchant_id}`);

      return {
        access_token: data.access_token,
        merchant_id: data.merchant_id,
        scopes: data.scope,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      this.logger.error(`Token exchange failed: ${errMsg}`);
      throw new Error(`OAuth token exchange failed: ${errMsg}`);
    }
  }

  /**
   * Refresh an expired access token using the refresh token from process.env.
   */
  async refreshToken(): Promise<void> {
    const refreshToken = process.env.RATIO_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error('No refresh token available. A merchant must install the app first.');
    }

    this.logger.log('Refreshing access token...');

    const response = await axios.post(`${this.apiBaseUrl}/api/v1/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    const data = response.data;

    // Update process.env immediately
    process.env.RATIO_ACCESS_TOKEN = data.access_token;
    process.env.RATIO_REFRESH_TOKEN = data.refresh_token;
    if (data.merchant_id) process.env.RATIO_MERCHANT_ID = data.merchant_id;
    if (data.scope) process.env.RATIO_SCOPES = data.scope;

    // Persist to .env file
    this.writeToEnvFile({
      RATIO_ACCESS_TOKEN: data.access_token,
      RATIO_REFRESH_TOKEN: data.refresh_token,
      ...(data.merchant_id && { RATIO_MERCHANT_ID: data.merchant_id }),
      ...(data.scope && { RATIO_SCOPES: data.scope }),
    });

    this.logger.log('Access token refreshed successfully.');
  }

  /**
   * Get the current access token from process.env.
   * Returns null if no merchant has installed yet.
   */
  getAccessToken(): string | null {
    return process.env.RATIO_ACCESS_TOKEN || null;
  }

  /**
   * Get the current merchant ID from process.env.
   */
  getMerchantId(): string | null {
    return process.env.RATIO_MERCHANT_ID || null;
  }

  /**
   * Write key-value pairs to the .env file. Updates existing keys, appends new ones.
   */
  private writeToEnvFile(values: Record<string, string>): void {
    const envPath = join(process.cwd(), '.env');
    if (!existsSync(envPath)) return;

    try {
      let envContent = readFileSync(envPath, 'utf-8');

      for (const [key, value] of Object.entries(values)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }

      writeFileSync(envPath, envContent);
      this.logger.log('Updated .env file with new token values.');
    } catch (error: any) {
      this.logger.warn(`Failed to update .env file: ${error.message}`);
    }
  }
}
