import { Module } from '@nestjs/common';
import { OAuthCallbackController } from './oauth-callback.controller';
import { OAuthCallbackService } from './oauth-callback.service';

@Module({
  controllers: [OAuthCallbackController],
  providers: [OAuthCallbackService],
  exports: [OAuthCallbackService],
})
export class OAuthCallbackModule {}
