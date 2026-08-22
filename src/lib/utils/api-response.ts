import { NextResponse } from "next/server";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function apiError(error: string, status = 400, errorCode?: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error, errorCode },
    { status }
  );
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public errorCode?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}
