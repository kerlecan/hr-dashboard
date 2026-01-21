import { NextRequest, NextResponse } from "next/server"

const DB_URL_MAP: Record<string, string> = {
  NAVLUNGO: "https://ik.hominum.info:3009",
  TEMAWORLD: "https://ik.hominum.info:3019",
  SHERATONPENDIK: "https://ik.hominum.info:3029",
  ADDRESS: "https://ik.hominum.info:3039",
  MODAHILTON: "https://ik.hominum.info:3049",
  SWOT: "https://ik.hominum.info:3059",
  DUZGIT: "https://ik.hominum.info:3069",
  BLUPERA: "https://ik.hominum.info:3079",
  HOMINUM: "https://ik.hominum.info:3089",
  ANADOLUHOTELS: "https://ik.hominum.info:3099",
  GRUPTRANS: "https://ik.hominum.info:3109",
  SINANDURU: "https://ik.hominum.info:3119",
  BOTEK: "https://ik.hominum.info:3129",
  GOLDENTULIP: "https://ik.hominum.info:3139",
  GULSOY: "https://ik.hominum.info:3149",
  CABA903: "https://ik.hominum.info:3159",
  GALLEY: "https://ik.hominum.info:3169",
  EFESAN: "https://ik.hominum.info:3179",
  EMAAR: "https://ik.hominum.info:3189",
  STAY: "https://ik.hominum.info:3199",
  QUBISH: "https://ik.hominum.info:3209",
  OTTOMARE: "https://ik.hominum.info:3219",
}

const API_TOKEN = process.env.API_TOKEN!

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dbName = searchParams.get("dbName") || request.headers.get("x-db-name")

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

    const PERSID = body?.PERSID ?? body?.persid
    const DATEINFO = body?.DATEINFO ?? body?.dateinfo
    const TIMEINFO = body?.TIMEINFO ?? body?.timeinfo
    const GPS = body?.GPS ?? body?.gps
    const GPS_X = body?.GPS_X ?? body?.gps_x ?? body?.gpsX
    const GPS_Y = body?.GPS_Y ?? body?.gps_y ?? body?.gpsY
    const GATEID = body?.GATEID ?? body?.gateid ?? body?.gateId

    const required = { PERSID, DATEINFO, TIMEINFO, GPS, GPS_X, GPS_Y, GATEID }
    const missing = Object.entries(required).find(([, v]) => !v)
    if (missing) {
      return NextResponse.json(
        { success: false, message: `${missing[0]} zorunlu` },
        { status: 400 }
      )
    }

    // Node-RED path: önceki çalışan rota
    const API_URL = `${apiBaseUrl}/butunbiApi/api/mobil-user/QR`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const bodyToSend = { PERSID, DATEINFO, TIMEINFO, GPS, GPS_X, GPS_Y, GATEID }
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "x-api-key": API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToSend),
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

      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      let errorMessage = "Mobil User QR API'ye bağlanılamadı"
      if (fetchError.name === "AbortError") errorMessage = "Mobil User QR API zaman aşımı"

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 503 }
      )
    }
  } catch (error: any) {
    console.error("Mobil User QR API error:", error)
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu" },
      { status: 500 }
    )
  }
}