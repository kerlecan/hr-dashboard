// app/api/auth/login/route. ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request:  NextRequest) {
  try {
    const body = await request.json();
    const { username, password, dbPort, dbName } = body;
    
    console.log('=== LOGIN REQUEST ===');
    console.log('Username:', username);
    console.log('dbPort:', dbPort);
    console.log('dbName:', dbName);
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Kullanıcı adı ve şifre gereklidir" },
        { status: 400 }
      );
    }

    const apiToken = process.env.API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { success: false, message:  "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    // Sadece belirtilen port'u kullan, fallback YAPMA
    const port = dbPort || 3089;
    const authUrl = `http://ik.hominum.info:${port}/butunbiApi/api/fin/auth`;
    
    console.log('Auth URL:', authUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(authUrl, {
        method: "POST",
        headers:  { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-api-key": apiToken
        },
        body: JSON. stringify({ username, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response. status);
      
      // Yanıtı parse et
      const data = await response.json().catch(() => null);
      console.log('Response data:', data);
      
      if (!response. ok) {
        // 401 = Şifre hatalı
        if (response.status === 401) {
          return NextResponse.json(
            { 
              success: false, 
              message: data?.message || "Şifre hatalı",
              errorType: data?.errorType || "WRONG_PASSWORD"
            },
            { status: 401 }
          );
        }
        
        // 404 = Kullanıcı bulunamadı
        if (response.status === 404) {
          return NextResponse.json(
            { 
              success: false, 
              message:  data?.message || "Kullanıcı bulunamadı",
              errorType: data?. errorType || "USER_NOT_FOUND"
            },
            { status: 404 }
          );
        }
        
        // Diğer hatalar
        return NextResponse.json(
          { 
            success: false, 
            message:  data?.message || "Giriş başarısız"
          },
          { status:  response.status }
        );
      }

      // Başarılı yanıt kontrolü
      if (! data || data.isSuccess === false) {
        return NextResponse.json(
          { 
            success: false, 
            message: data?.message || "Giriş başarısız",
            errorType: data?.errorType
          },
          { status: 401 }
        );
      }

      // Başarılı giriş
      console.log('=== LOGIN SUCCESS ===');
      return NextResponse.json({
        success: true,
        message: "Giriş başarılı",
        user: {
          username: data.username,
          sicil: data.sicil,
          displayName: data.display,
          userProfile: data.userprofile
        }
      });

    } catch (fetchError:  any) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError. message);
      
      return NextResponse.json(
        { 
          success: false, 
          message: fetchError.name === 'AbortError' 
            ? "API zaman aşımı" 
            : "API sunucusuna bağlanılamadı"
        },
        { status:  503 }
      );
    }

  } catch (error:  any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers:  {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}