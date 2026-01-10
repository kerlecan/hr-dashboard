// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password, dbPort } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message:  "Kullanıcı adı ve şifre gereklidir" },
        { status:  400 }
      );
    }

    const apiToken = process.env.API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { success: false, message:  "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    // dbPort dinamik olarak user-lookup'tan geliyor, yoksa default 3089
    const port = dbPort || 3089;
    const authUrl = `http://ik.hominum.info:${port}/butunbiApi/api/fin/auth`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000000);
    
    try {
      const response = await fetch(authUrl, {
        method: "POST",
        headers:  { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-api-key": apiToken
        },
        body: JSON.stringify({ username, password }),
        signal: controller. signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = "Giriş başarısız";
        
        if (response.status === 401) {
          errorMessage = "Şifre hatalı";
        } else if (response.status === 404) {
          errorMessage = "Kullanıcı bulunamadı";
        }
        
        return NextResponse.json(
          { 
            success:  false, 
            message: errorMessage
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Node-RED'den gelen yanıtı kontrol et
      if (!data || data.isSuccess === false) {
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
      return NextResponse.json({
        success: true,
        message:  "Giriş başarılı",
        user: {
          username: data.username,
          sicil: data.sicil,
          displayName: data. display,
          userProfile: data.userprofile
        }
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      let errorMessage = "Dış API'ye bağlanılamadı";
      if (fetchError.name === 'AbortError') {
        errorMessage = "API zaman aşımı";
      }
      
      return NextResponse.json(
        { 
          success:  false, 
          message: errorMessage
        },
        { status: 503 }
      );
    }

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: "Sunucu hatası oluştu"
      },
      { status:  500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers:  {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}