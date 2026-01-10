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
}

const API_TOKEN = process.env.API_TOKEN!

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dbName = searchParams.get('dbName') || request.headers.get('x-db-name')

    if (!dbName) {
      return NextResponse.json(
        { success: false, message: "Database adı belirtilmedi (dbName parametresi gerekli)" },
        { status: 400 }
      )
    }

    const normalizedDbName = dbName.toUpperCase().trim()
    const apiBaseUrl = DB_URL_MAP[normalizedDbName]

    if (!apiBaseUrl) {
      return NextResponse.json(
        { success: false, message: `"${dbName}" veritabanı için URL bulunamadı` },
        { status: 400 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { success: false, message: "API_TOKEN çevre değişkeni ayarlanmamış" },
        { status: 500 }
      )
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: "Geçersiz JSON gövdesi" },
        { status: 400 }
      )
    }

    if (!body?.persid) {
      return NextResponse.json(
        { success: false, message: "persid zorunlu" },
        { status: 400 }
      )
    }

    const API_URL = `${apiBaseUrl}/butunbiApi/api/mobil-user/payroll-history`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "x-api-key": API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorText = await res.text()
        let errorMessage = `API Hatası: ${res.status}`
        if (res.status === 401) errorMessage = "Yetkisiz erişim"
        else if (res.status === 404) errorMessage = "Endpoint bulunamadı"
        else if (res.status >= 500) errorMessage = "Sunucu hatası"

        return NextResponse.json(
          { success: false, message: errorMessage, error: errorText },
          { status: res.status }
        )
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      let errorMessage = "Payroll History API'ye bağlanılamadı"
      if (fetchError.name === "AbortError") errorMessage = "Payroll History API zaman aşımı"

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 503 }
      )
    }
  } catch (error: any) {
    console.error("Payroll History  API error:", error)
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu" },
      { status: 500 }
    )
  }
}