import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "@auth/core/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER";
      showroomId: string | null;
      phone: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER";
    showroomId?: string | null;
    phone?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends DefaultJWT {
    role?: "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER";
    showroomId?: string | null;
    phone?: string;
  }
}

declare module "next-auth/react" {
  export function signIn(provider?: string, options?: any, authorizationParams?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export function useSession(): any;
  export function SessionProvider(props: any): any;
}
