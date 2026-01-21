import { NextRequest, NextResponse } from "next/server";

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
};

const API_TOKEN = process.env.API_TOKEN!;

async function tryFetch(
  url: string,
  body: any,
  headers: Record<string, string>,
  signal: AbortSignal
) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get("dbName") || request.headers.get("x-db-name");

    if (!dbName) {
      return NextResponse.json(
        { success: false, message: "Database adı belirtilmedi" },
        { status: 400 }
      );
    }

    const apiBaseUrl = DB_URL_MAP[dbName.toUpperCase().trim()];
    if (!apiBaseUrl) {
      return NextResponse.json(
        { success: false, message: `"${dbName}" için API bulunamadı` },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Basit frontend guard
    if (!body?.surveyId || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { success: false, message: "Geçersiz survey submit payload" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "x-api-key": API_TOKEN,
      "Content-Type": "application/json",
    };

    // User context forward (çok önemli)
    const userId = request.headers.get("x-user-id");
    if (userId) headers["x-user-id"] = userId;

    const targetUrl = `${apiBaseUrl}/butunbiApi/api/mobil-user/survey/submit`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100000); 

    try {
      const res = await tryFetch(targetUrl, body, headers, controller.signal);
      clearTimeout(timeoutId);

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          success: false,
          message:
            err?.name === "AbortError"
              ? "Survey submit zaman aşımı"
              : "Survey submit bağlantı hatası",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Survey Submit API error:", error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
