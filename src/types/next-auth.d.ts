import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "MEMBER" | "GUEST";
      canPost: boolean;
    };
  }
  interface User {
    role: string;
    canPost: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    canPost: boolean;
  }
}
