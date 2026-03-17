import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Define public vs protected paths
    const isPublicPath = path.startsWith('/auth');
    const isProtectedPath = path.startsWith('/dashboard') || path.startsWith('/meeting');

    const token = request.cookies.get("token")?.value;

    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedPath && !token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect authenticated users trying to access auth routes (login/signup)
    if (isPublicPath && token) {
        // Only redirect if trying to access actual login/signup/forgot-password pages, 
        // not necessarily logout or verification if handled via GET
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    return NextResponse.next();
}

export const config = {
    // the path which user cannot visit directly
    // Dashboard, verifyEmail, forgotPassword, resetPassword
    matcher: ['/dashboard/:path*']
    //covers everything inside profile like profile/user..etc
}