import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { RateLimiterService } from '../../core/services/rate-limiter.service';

@Module({
  imports: [],
  controllers: [TestingController],
  providers: [RateLimiterService],
  exports: [],
})
export class TestingModule { }
