// app/api/debug-auth/route. ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request:  NextRequest) {
  const startTime = Date.now();
  
  try {
    const { username, password, dbPort } = await request.json();
    const port = dbPort || 3089;
    const authUrl = `https://ik.hominum.info:${port}/butunbiApi/api/fin/auth`;
    
    console.log('=== DEBUG AUTH ===');
    console.log('URL:', authUrl);
    console.log('Port:', port);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const fetchStart = Date.now();
      
      const response = await fetch(authUrl, {
        method: "POST",
        headers:  { 
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const fetchTime = Date.now() - fetchStart;
      const data = await response.json().catch(() => null);
      
      return NextResponse.json({
        success: true,
        debug: {
          url: authUrl,
          port:  port,
          fetchTime: `${fetchTime}ms`,
          totalTime: `${Date.now() - startTime}ms`,
          responseStatus: response.status,
          responseData: data
        }
      });
      
    } catch (fetchError:  any) {
      clearTimeout(timeoutId);
      
      return NextResponse.json({
        success: false,
        debug: {
          url: authUrl,
          port: port,
          totalTime: `${Date.now() - startTime}ms`,
          error: fetchError.message,
          errorName: fetchError.name,
          errorType: fetchError.name === 'AbortError' ?  'TIMEOUT' : 'FETCH_ERROR'
        }
      });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      totalTime: `${Date.now() - startTime}ms`
    });
  }
}