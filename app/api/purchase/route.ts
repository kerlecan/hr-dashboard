// app/api/purchase/route.ts
import { NextRequest, NextResponse } from "next/server"

// Database adlarına göre URL mapping (database.config.ts'ten kopyala)
const DB_URL_MAP: Record<string, string> = {
  "NAVLUNGO": "https://ik.hominum.info:3009",
  "TEMAWORLD": "https://ik.hominum.info:3019",
  "SHERATONPENDIK": "https://ik.hominum.info:3029",
  "ADDRESS": "https://ik.hominum.info:3039",
  "MODAHILTON": "https://ik.hominum.info:3049",
  "SWOT": "https://ik.hominum.info:3059",
  "DUZGIT": "https://ik.hominum.info:3069",
  "BLUPERA": "https://ik.hominum.info:3079",
  "HOMINUM": "https://ik.hominum.info:3089",
  "ANADOLUHOTELS": "https://ik.hominum.info:3099",
  "GRUPTRANS": "https://ik.hominum.info:3109",
  "SINANDURU": "https://ik.hominum.info:3119",
  "BOTEK": "https://ik.hominum.info:3129",
  "GOLDENTULIP": "https://ik.hominum.info:3139",
  "GULSOY": "https://ik.hominum.info:3149",
  "CABA903": "https://ik.hominum.info:3159",
  "GALLEY": "https://ik.hominum.info:3169",
  "EFESAN": "https://ik.hominum.info:3179",
  "EMAAR": "https://ik.hominum.info:3189",
  "STAY": "https://ik.hominum.info:3199",
  "QUBISH": "https://ik.hominum.info:3209",
  "OTTOMARE": "https://ik.hominum.info:3219"
};

const API_TOKEN = process.env.API_TOKEN!

export async function GET(request: NextRequest) {
  try {
    console.log("Purchase API called")

    // 1. Query parameter veya header'dan dbName al
    const { searchParams } = new URL(request.url)
    const dbName = searchParams.get('dbName') || request.headers.get('x-db-name')
    
    if (!dbName) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Database adı belirtilmedi (dbName parametresi gerekli)" 
        },
        { status: 400 }
      )
    }

    // 2. DB URL'sini mapping'den bul
    const normalizedDbName = dbName.toUpperCase().trim()
    const apiBaseUrl = DB_URL_MAP[normalizedDbName]
    
    if (!apiBaseUrl) {
      return NextResponse.json(
        { 
          success: false, 
          message: `"${dbName}" veritabanı için URL bulunamadı` 
        },
        { status: 400 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { 
          success: false, 
          message: "API_TOKEN çevre değişkeni ayarlanmamış" 
        },
        { status: 500 }
      )
    }

    // 3. Kullanıcıya özel API URL ile istek yap
    const apiUrl = `${apiBaseUrl}/butunbiApi/api/purchase/detail`
    console.log("Fetching from user-specific URL:", apiUrl)

    const res = await fetch(apiUrl, {
      headers: {
        "x-api-key": API_TOKEN,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    console.log("Backend response status:", res.status)

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json(
        {
          success: false,
          message: `Upstream API error: ${res.status}`,
          error: errorText,
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    console.log("Backend response data length:", data?.data?.length || data?.length || 0)

    // Node-RED yeni formatı: { success: true, count: X, data: [...] }
    // Eski format için backward compatibility
    let purchaseData = []
    
    if (data.success && Array.isArray(data.data)) {
      // Yeni format: data.data içinde array var
      purchaseData = data.data
    } else if (Array.isArray(data)) {
      // Eski format: direkt array
      purchaseData = data
    } else if (data.data && Array.isArray(data.data)) {
      // Başka bir olası format
      purchaseData = data.data
    } else {
      purchaseData = []
    }

    return NextResponse.json({
      success: true,
      data: purchaseData,
      meta: {
        total: purchaseData.length,
        count: data.count || purchaseData.length,
        dbName: dbName,
        apiBaseUrl: apiBaseUrl
      },
    })
  } catch (error: any) {
    console.error("Purchase API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    )
  }
}