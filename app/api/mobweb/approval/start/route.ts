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
    /* --------------------------------------------------
     * DB NAME OKUMA
     * -------------------------------------------------- */
    const { searchParams } = new URL(request.url)
    const dbName =
      searchParams.get("dbName") ||
      request.headers.get("x-db-name")

    if (!dbName) {
      return NextResponse.json(
        {
          success: false,
          message: "Database adı belirtilmedi (dbName zorunlu)",
        },
        { status: 400 }
      )
    }

    const normalizedDbName = dbName.toUpperCase().trim()
    const apiBaseUrl = DB_URL_MAP[normalizedDbName]

    if (!apiBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: `"${dbName}" için API adresi tanımlı değil`,
        },
        { status: 400 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          message: "API_TOKEN environment variable eksik",
        },
        { status: 500 }
      )
    }

    /* --------------------------------------------------
     * BODY OKUMA
     * -------------------------------------------------- */
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: "Geçersiz JSON body" },
        { status: 400 }
      )
    }

    if (!body?.requestId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "requestId zorunludur" 
        },
        { status: 400 }
      )
    }

    /* --------------------------------------------------
     * MOBWEB APPROVAL START API
     * -------------------------------------------------- */
    const API_URL = `${apiBaseUrl}/butunbiApi/api/mobweb/approval/start`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "x-api-key": API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: body.requestId,
        }),
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorText = await res.text()

        let message = "Onay akışı başlatma servisi hata verdi"
        if (res.status === 401) message = "Yetkisiz erişim"
        else if (res.status === 404) message = "API endpoint bulunamadı"
        else if (res.status >= 500) message = "Servis sunucu hatası"

        return NextResponse.json(
          {
            success: false,
            message,
            status: res.status,
            detail: errorText,
          },
          { status: res.status }
        )
      }

      const data = await res.json()

      /* --------------------------------------------------
       * FRONTEND'E ŞEFFAF AKTAR
       * -------------------------------------------------- */
      return NextResponse.json({
        success: true,
        source: "mobweb-approval-start",
        dbName: normalizedDbName,
        ...data,
      })
    } catch (err: any) {
      clearTimeout(timeoutId)

      let message = "Onay akışı başlatma API erişilemiyor"
      if (err.name === "AbortError") {
        message = "Onay akışı başlatma API zaman aşımı"
      }

      return NextResponse.json(
        { success: false, message },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("MobWeb Approval Start Route Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Beklenmeyen sunucu hatası",
      },
      { status: 500 }
    )
  }
}