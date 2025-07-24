import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  async getHash(pass): Promise<string> {
    try {
      return await bcrypt.hash(pass, 10);
    } catch (error) {
      console.log(error);
      throw new Error('Failed to hash password');
    }
  }
}
