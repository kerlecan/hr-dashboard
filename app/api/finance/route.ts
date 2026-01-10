import { NextRequest, NextResponse } from "next/server"

// Database adlarına göre URL mapping
const DB_URL_MAP: Record<string, string> = {
  "NAVLUNGO": "http://ik.hominum.info:3009",
  "TEMAWORLD": "http://ik.hominum.info:3019",
  "SHERATONPENDIK": "http://ik.hominum.info:3029",
  "ADDRESS": "http://ik.hominum.info:3039",
  "MODAHILTON": "http://ik.hominum.info:3049",
  "SWOT": "http://ik.hominum.info:3059",
  "DUZGIT": "http://ik.hominum.info:3069",
  "BLUPERA": "http://ik.hominum.info:3079",
  "HOMINUM": "http://ik.hominum.info:3089",
  "ANADOLUHOTELS": "http://ik.hominum.info:3099",
  "GRUPTRANS": "http://ik.hominum.info:3109",
  "SINANDURU": "http://ik.hominum.info:3119",
  "BOTEK": "http://ik.hominum.info:3129",
  "GOLDENTULIP": "http://ik.hominum.info:3139",
  "GULSOY": "http://ik.hominum.info:3149",
  "CABA903": "http://ik.hominum.info:3159",
  "GALLEY": "http://ik.hominum.info:3169",
  "EFESAN": "http://ik.hominum.info:3179",
  "EMAAR": "http://ik.hominum.info:3189",
  "STAY": "http://ik.hominum.info:3199",
  "QUBISH": "http://ik.hominum.info:3209",
  "OTTOMARE": "http://ik.hominum.info:3219"
};

const API_TOKEN = process.env.API_TOKEN!

async function fetchFromNodeRED(endpoint: string, apiBaseUrl: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1000000)
  
  try {
    const res = await fetch(`${apiBaseUrl}/butunbiApi/api/fin${endpoint}`, {
      headers: {
        "x-api-key": API_TOKEN,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`API Error: ${res.status} - ${errorText}`)
    }

    return res.json()
  } catch (fetchError: any) {
    clearTimeout(timeoutId)
    
    let errorMessage = "API'ye bağlanılamadı"
    if (fetchError.name === 'AbortError') {
      errorMessage = "API zaman aşımı"
    }
    
    throw new Error(`${errorMessage}: ${fetchError.message}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const dbName = searchParams.get('dbName') || request.headers.get('x-db-name')
    
    if (!endpoint) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Endpoint parametresi gereklidir" 
        },
        { status: 400 }
      )
    }

    if (!dbName) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Database adı belirtilmedi (dbName parametresi gerekli)" 
        },
        { status: 400 }
      )
    }

    // DB URL'sini mapping'den bul
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

    const data = await fetchFromNodeRED(endpoint, apiBaseUrl)
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Finance API error:', error)
    
    let statusCode = 500
    let errorMessage = error.message || "Sunucu hatası oluştu"
    
    if (error.message.includes('401')) {
      statusCode = 401
      errorMessage = "Yetkisiz erişim"
    } else if (error.message.includes('404')) {
      statusCode = 404
      errorMessage = "Endpoint bulunamadı"
    } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      statusCode = 503
      errorMessage = "API zaman aşımı"
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage
      },
      { status: statusCode }
    )
  }
}