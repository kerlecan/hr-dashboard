// app/api/auth/login/route. ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request:  NextRequest) {
  try {
    const body = await request. json();
    const { username, password, dbPort, dbName } = body;
    
    console.log('Login request:', { username, dbPort, dbName });
    
    if (!username || ! password) {
      return NextResponse.json(
        { success: false, message: "Kullanıcı adı ve şifre gereklidir" },
        { status: 400 }
      );
    }

    const apiToken = process.env. API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { success: false, message: "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    // Önce dinamik port dene, başarısız olursa 3089'a fallback yap
    const ports = [dbPort, 3089]. filter(Boolean);
    let lastError:  any = null;
    
    for (const port of ports) {
      const authUrl = `http://ik.hominum.info:${port}/butunbiApi/api/fin/auth`;
      console.log('Trying Auth URL:', authUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(authUrl, {
          method:  "POST",
          headers: { 
            "Content-Type":  "application/json",
            "Accept": "application/json",
            "x-api-key":  apiToken
          },
          body: JSON.stringify({ 
            username, 
            password,
            dbName  // Node-RED'e hangi DB olduğunu bildir
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log(`Port ${port} response status: `, response.status);
        
        if (!response.ok) {
          // 401, 404 gibi hatalar gerçek hatalardır, bunları döndür
          if (response. status === 401 || response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
              { 
                success: false, 
                message: response.status === 401 ? "Şifre hatalı" : "Kullanıcı bulunamadı",
                errorType: errorData?.errorType
              },
              { status: response.status }
            );
          }
          // Diğer hatalar için sonraki portu dene
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`Port ${port} response data:`, data);
        
        if (! data || data.isSuccess === false) {
          return NextResponse. json(
            { 
              success: false, 
              message: data?.message || "Giriş başarısız",
              errorType: data?.errorType
            },
            { status:  401 }
          );
        }

        // Başarılı giriş
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
        console.error(`Port ${port} failed:`, fetchError.message);
        lastError = fetchError;
        // Sonraki portu dene
        continue;
      }
    }
    
    // Tüm portlar başarısız oldu
    console.error('All ports failed, last error:', lastError);
    return NextResponse.json(
      { 
        success: false, 
        message: "API sunucusuna bağlanılamadı.  Lütfen tekrar deneyin."
      },
      { status:  503 }
    );

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status:  200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':  'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}