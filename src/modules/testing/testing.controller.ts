import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { RateLimiterService } from '../../core/services/rate-limiter.service';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
    private readonly rateLimiterService: RateLimiterService,
  ) { }

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const collections = await this.databaseConnection.listCollections();

    const promises = collections.map((collection) =>
      this.databaseConnection.collection(collection.name).deleteMany({}),
    );
    await Promise.all(promises);

    // Clear rate limiter cache
    this.rateLimiterService.clearAll();

    return {
      status: 'succeeded',
    };
  }
}
