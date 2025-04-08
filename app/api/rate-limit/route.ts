import { type NextRequest, NextResponse } from "next/server";
import { getRateLimitInfo, getClientIp } from "@/lib/rate-limiter";
import { RATE_LIMIT } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const ip = (await getClientIp()) || "127.0.0.1";
    console.log("Rate limit request from IP:", ip);

    const rateLimitInfo = await getRateLimitInfo(ip);

    console.log("Rate limit info for response:", {
      remaining: rateLimitInfo.remaining,
      limit: RATE_LIMIT.MAX_REQUESTS, // Daily limit
      used: rateLimitInfo.used,
      resetAt: rateLimitInfo.resetAt,
      isLimited: rateLimitInfo.isLimited,
    });

    return NextResponse.json({
      remaining: rateLimitInfo.remaining,
      limit: RATE_LIMIT.MAX_REQUESTS, // Daily limit
      used: rateLimitInfo.used,
      resetAt: rateLimitInfo.resetAt,
      isLimited: rateLimitInfo.isLimited,
    });
  } catch (error) {
    console.error("Error in rate limit API:", error);
    return NextResponse.json(
      { error: "Failed to get rate limit information" },
      { status: 500 },
    );
  }
}
