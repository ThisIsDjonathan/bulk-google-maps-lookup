import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getRateLimitInfo,
  incrementRateLimit,
  getClientIp,
} from "@/lib/rate-limiter";
import { RATE_LIMIT } from "@/lib/rate-limiter";

export async function middleware(request: NextRequest) {
  // Get client IP address
  const ip = (await getClientIp()) || "127.0.0.1";
  console.log(
    `Middleware processing request from ${ip} to ${request.nextUrl.pathname}`,
  );

  // Only apply rate limiting to Google API routes
  if (request.nextUrl.pathname.startsWith("/api/google")) {
    const rateLimitInfo = await getRateLimitInfo(ip);

    // If rate limited, return 429 Too Many Requests
    if (rateLimitInfo.isLimited) {
      console.log(`Rate limit exceeded for ${ip}`);
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Daily request limit reached. Please try again tomorrow.",
          resetAt: rateLimitInfo.resetAt,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": RATE_LIMIT.MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.floor(
              rateLimitInfo.resetAt.getTime() / 1000,
            ).toString(),
          },
        },
      );
    }

    // Increment rate limit counter
    console.log(`Incrementing rate limit for ${ip} from middleware`);
    await incrementRateLimit(ip);

    // Get updated rate limit info after incrementing
    const updatedRateLimitInfo = await getRateLimitInfo(ip);

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Limit",
      RATE_LIMIT.MAX_REQUESTS.toString(),
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      updatedRateLimitInfo.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      Math.floor(updatedRateLimitInfo.resetAt.getTime() / 1000).toString(),
    );

    return response;
  }

  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
};
