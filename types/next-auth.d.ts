import { Role } from '@prisma/client';
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// By declaring this module, we are extending the original types from next-auth
declare module 'next-auth' {
  /**
   * This is the shape of the session object you receive from `useSession` or `getSession`.
   * We are adding our custom 'id' and 'role' properties to the user object.
   */
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user']; // Keep the default properties
  }

  /**
   * This is the shape of the user object that is returned from the `authorize` callback.
   * We are adding our custom 'role' property.
   */
  interface User extends DefaultUser {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  /**
   * This is the shape of the JWT token that is passed between callbacks.
   * We are adding our custom 'id' and 'role' properties.
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}
