import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER";
      showroomId: string | null;
      phone: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER";
    showroomId: string | null;
    phone: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER";
    showroomId: string | null;
    phone: string;
  }
}
