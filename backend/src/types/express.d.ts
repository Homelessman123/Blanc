import { User } from '@prisma/client';

// Define a user type without password for security
type UserWithoutPassword = Omit<User, 'password'>;

declare global {
  namespace Express {
    export interface Request {
      user?: UserWithoutPassword;
    }
  }
}

export { };
