import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hr-token')?.value
  const pathname = request.nextUrl.pathname

  console.log('Middleware çalıştı:', { pathname, hasToken: !!token })

  // Login sayfası için
  if (pathname === '/login') {
    if (token) {
      console.log('Token var, dashboard\'a yönlendiriliyor')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    console.log('Login sayfasına erişim izni verildi')
    return NextResponse.next()
  }

  // Dashboard ve alt sayfalar için
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      console.log('Token yok, login sayfasına yönlendiriliyor')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    console.log('Dashboard erişim izni verildi')
    return NextResponse.next()
  }

  // Diğer tüm sayfalar için
  return NextResponse.next()
}

// Middleware'in hangi sayfalarda çalışacağını belirle
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}