declare module "next-auth/jwt" {
  export function getToken(params: any): Promise<any>;
  export function encode(params: any): Promise<string>;
  export function decode(params: any): Promise<any>;
}
