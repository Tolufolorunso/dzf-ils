import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Configuration constants
const AUTH_COOKIE_NAME = 'ils_token';
const LOGIN_PATH = '/auth/login';
const DEFAULT_REDIRECT = '/dashboard';

// Route definitions with more precise matching
const ROUTES = {
  public: [
    '/',
    '/auth/login',
    '/auth/register',
    '/forgot-password',
    '/reset-password',
  ],
  publicApi: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ],
  authPages: [
    '/auth/login',
    '/auth/register',
    '/forgot-password',
    '/reset-password',
  ],
  protected: [
    '/dashboard',
    '/catalog',
    '/circulations',
    '/circulation',
    '/patrons',
    '/settings',
    '/reports',
  ],
  protectedApi: [
    '/api/auth/me',
    '/api/catalog',
    '/api/circulations',
    '/api/patrons',
    '/api/settings',
    '/api/reports',
  ],
};

// Helper function to check if path matches any in the list
const matchesPath = (pathname, paths) => {
  return paths.some((path) => {
    // Exact match or starts with path followed by / or query params
    return (
      pathname === path ||
      pathname.startsWith(`${path}/`) ||
      pathname.startsWith(`${path}?`)
    );
  });
};

// JWT verification with better error handling
async function verifyJWT(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Additional validation
    if (!payload.id || !payload.role) {
      throw new Error('Invalid token payload');
    }

    // Check token expiration if not handled by jose
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    throw error;
  }
}

// Create response with user context headers
function createAuthenticatedResponse(request, payload) {
  const response = NextResponse.next();

  // Set user context headers for server components
  response.headers.set('x-user-id', String(payload.id));
  response.headers.set('x-user-role', String(payload.role));
  response.headers.set('x-user-email', String(payload.email || ''));

  return response;
}

// Create redirect response with optional message
function createRedirectResponse(url, request, options = {}) {
  const redirectUrl = new URL(url, request.url);

  if (options.redirect) {
    redirectUrl.searchParams.set('redirect', options.redirect);
  }

  if (options.message) {
    redirectUrl.searchParams.set('message', options.message);
  }

  const response = NextResponse.redirect(redirectUrl);

  // Clear invalid token if specified
  if (options.clearToken) {
    response.cookies.delete(AUTH_COOKIE_NAME);
  }

  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Skip middleware for static assets (additional safety)
  if (pathname.includes('/_next/') || pathname.includes('/static/')) {
    return NextResponse.next();
  }

  // Log middleware execution in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${request.method} ${pathname}`);
  }

  try {
    // Case 1: Authenticated user trying to access auth pages
    if (token && matchesPath(pathname, ROUTES.authPages)) {
      try {
        const payload = await verifyJWT(token);

        // Redirect to dashboard or original destination
        const redirectTo =
          request.nextUrl.searchParams.get('redirect') || DEFAULT_REDIRECT;
        return createRedirectResponse(redirectTo, request);
      } catch (error) {
        // Invalid token, let them access auth page
        console.warn('Invalid token on auth page access:', error.message);

        // Clear invalid token
        const response = NextResponse.next();
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
      }
    }

    // Case 2: Public routes - no authentication required
    if (matchesPath(pathname, [...ROUTES.public, ...ROUTES.publicApi])) {
      return NextResponse.next();
    }

    // Case 3: Protected routes - authentication required
    const isProtectedRoute = matchesPath(pathname, [
      ...ROUTES.protected,
      ...ROUTES.protectedApi,
    ]);

    if (isProtectedRoute) {
      if (!token) {
        // API routes should return 401 instead of redirect
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Web routes redirect to login
        return createRedirectResponse(LOGIN_PATH, request, {
          redirect: pathname,
          message: 'Please log in to continue',
        });
      }

      try {
        const payload = await verifyJWT(token);

        // Optional: Check role-based access
        if (pathname.startsWith('/admin') && payload.role !== 'admin') {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        return createAuthenticatedResponse(request, payload);
      } catch (error) {
        console.error('Token verification failed:', error.message);

        // API routes return 401
        if (pathname.startsWith('/api/')) {
          const response = NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          );
          response.cookies.delete(AUTH_COOKIE_NAME);
          return response;
        }

        // Web routes redirect to login
        return createRedirectResponse(LOGIN_PATH, request, {
          redirect: pathname,
          message: 'Session expired. Please log in again',
          clearToken: true,
        });
      }
    }

    // Case 4: All other routes (optional authentication)
    if (token) {
      try {
        const payload = await verifyJWT(token);
        return createAuthenticatedResponse(request, payload);
      } catch (error) {
        // Invalid token, clear it and continue
        const response = NextResponse.next();
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
      }
    }

    // Default: Allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);

    // In case of unexpected errors, allow the request to continue
    // but log the error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware stack trace:', error.stack);
    }

    return NextResponse.next();
  }
}

// Matcher configuration for Next.js 15
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder images (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     * - public folder fonts (.woff, .woff2, .ttf, .otf)
     */
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
