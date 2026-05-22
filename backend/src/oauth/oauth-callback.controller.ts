import { Controller, Get, Query, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { OAuthCallbackService } from './oauth-callback.service';

@Controller()
export class OAuthCallbackController {
  private readonly logger = new Logger(OAuthCallbackController.name);

  constructor(private readonly oauthService: OAuthCallbackService) {}

  /**
   * OAuth callback endpoint.
   * Receives the authorization code from the merchant store redirect:
   *   GET /callback?code=xxx&state=yyy
   *
   * Exchanges the code for an access token and stores it per merchant.
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    this.logger.log(`OAuth callback received — code=${code?.substring(0, 12)}..., state=${state?.substring(0, 12)}...`);

    if (!code) {
      this.logger.warn('OAuth callback received without code');
      return res.status(400).send(`
        <html><body>
          <h1>OAuth Error</h1>
          <p>No authorization code received. The merchant may have denied the request.</p>
        </body></html>
      `);
    }

    try {
      const result = await this.oauthService.exchangeCodeForToken(code);

      this.logger.log(`App installed successfully for merchant: ${result.merchant_id}`);

      // Redirect to the embedded app frontend with merchant_id
      const appBaseUrl = process.env.RATIO_APP_FRONTEND_URL;
      if (appBaseUrl) {
        return res.redirect(`${appBaseUrl}?merchant_id=${result.merchant_id}`);
      }

      return res.status(200).send(`
        <html><body>
          <h1>App Installed Successfully!</h1>
          <p>Merchant <strong>${result.merchant_id}</strong> has installed your app.</p>
          <p>You can now use Exportify from your store dashboard.</p>
          <script>
            // Try to pass merchant_id to the parent window if embedded
            if (window.opener) {
              window.opener.postMessage({ type: 'merchant_installed', merchant_id: '${result.merchant_id}' }, '*');
            }
          </script>
        </body></html>
      `);
    } catch (error: any) {
      this.logger.error(`OAuth callback failed: ${error.message}`);

      return res.status(500).send(`
        <html><body>
          <h1>Installation Failed</h1>
          <p>Error: ${error.message}</p>
          <p>Please try installing the app again.</p>
        </body></html>
      `);
    }
  }
}
