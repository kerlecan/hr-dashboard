// app/api/auth/user-lookup/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, message: "Geçerli bir kullanıcı adı gereklidir" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.MOBILE_WEB_APP_URL;
    const apiToken = process.env.API_TOKEN;
    
    if (!apiUrl || !apiToken) {
      return NextResponse.json(
        { success: false, message: "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000000);
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-api-key": apiToken
        },
        body: JSON.stringify({ username }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = "Kullanıcı bilgileri alınamadı";
        
        if (response.status === 401) {
          errorMessage = "Yetkisiz erişim";
        } else if (response.status === 404) {
          errorMessage = "Kullanıcı bulunamadı";
        }
        
        return NextResponse.json(
          { 
            success: false, 
            message: errorMessage
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      if (!data || data.success === false) {
        return NextResponse.json(
          { 
            success: false, 
            message: data?.message || "Kullanıcı bulunamadı"
          },
          { status: 404 }
        );
      }

      const userData = data.user || data;
      
      if (!userData.dbName) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Kullanıcı veritabanı bilgisi eksik"
          },
          { status: 400 }
        );
      }

      const dbPort = userData.dbPort || 3159;
      const apiBaseUrl = `http://ik.hominum.info:${dbPort}`;
      
      return NextResponse.json({
        success: true,
        message: "Kullanıcı bilgileri alındı",
        dbName: userData.dbName,
        dbPort: dbPort,
        apiBaseUrl: apiBaseUrl,
        user: {
          username: userData.username || userData.tc || username,
          userProfile: userData.userprofile || userData.userProfile || 'WEB',
          displayName: userData.display || userData.displayName || username,
          persid: userData.persid || userData.sicil || null,
          ismanager: userData.ismanager || 0,
          office: userData.office || null,
          managerid: userData.managerid || null,
          subFirm: userData.subFirm || null,
          subFirmid: userData.subFirmid || null,
          dbName: userData.dbName,
          dbPort: dbPort
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
          success: false, 
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
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}