import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;//cookie value can be undefined, thus preventing from crashing
    if (!token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }
}

export const config = {
    // the path which user cannot visit directly
    // Dashboard, verifyEmail, forgotPassword, resetPassword
    matcher: ['/dashboard/:path*']
    //covers everything inside profile like profile/user..etc
}