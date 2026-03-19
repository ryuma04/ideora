import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Define public vs protected paths
    const isPublicPath = path.startsWith('/auth');
    const isMeetingPath = path.startsWith('/meeting'); // Accessible by both guests and logged-in users
    const isProtectedPath = path.startsWith('/dashboard'); // Only logged-in users

    const token = request.cookies.get("token")?.value;

    // Allow meeting routes for everyone (guests join via shared links)
    if (isMeetingPath) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users trying to access protected routes (dashboard)
    if (isProtectedPath && !token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect authenticated users trying to access login/signup pages
    // But allow verifyEmail, resetPassword, forgotPassword even when logged in
    const authExemptPaths = ['/auth/verifyEmail', '/auth/resetPassword', '/auth/forgotPassword'];
    const isAuthExempt = authExemptPaths.some(p => path.startsWith(p));
    
    if (isPublicPath && token && !isAuthExempt) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    return NextResponse.next();
}

export const config = {
    // Standard matcher for protected and auth routes
    matcher: [
        '/dashboard/:path*',
        '/meeting/:path*',
        '/auth/:path*',
    ]
}
