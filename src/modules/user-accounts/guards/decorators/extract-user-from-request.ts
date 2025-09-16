import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';


export const ExtractUserFromRequest = createParamDecorator(
    (data: unknown, context: ExecutionContext): UserContextDto | null => {
        const request = context.switchToHttp().getRequest();

        const user = request.user;

        if (!user) {
            // For optional authentication, return null instead of throwing
            return null;
        }

        return user;
    },
);