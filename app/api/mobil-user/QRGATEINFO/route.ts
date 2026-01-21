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

async function tryFetch(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": API_TOKEN,
      "Content-Type": "application/json",
    },
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
        { success: false, message: "Database adı belirtilmedi (dbName parametresi gerekli)" },
        { status: 400 }
      );
    }

    const normalizedDbName = dbName.toUpperCase().trim();
    const apiBaseUrl = DB_URL_MAP[normalizedDbName];

    if (!apiBaseUrl) {
      return NextResponse.json(
        { success: false, message: `"${dbName}" veritabanı için URL bulunamadı` },
        { status: 400 }
      );
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { success: false, message: "API_TOKEN çevre değişkeni ayarlanmamış" },
        { status: 500 }
      );
    }

    // Fallback sırasıyla dene: düz path ve /butunbiApi prefix
    const candidateUrls = [
      `${apiBaseUrl}/butunbiApi/api/mobil-user/QRGATEINFO`,
    ];

    let lastError: any = null;
    for (const url of candidateUrls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await tryFetch(url, controller.signal);
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }

        // 404 ise bir sonraki yolu dene, diğer durumlarda hata döndür
        if (res.status !== 404) {
          const errorText = await res.text();
          return NextResponse.json(
            {
              success: false,
              message:
                res.status === 401
                  ? "Yetkisiz erişim"
                  : res.status >= 500
                  ? "Sunucu hatası"
                  : `API Hatası: ${res.status}`,
              error: errorText,
              tried: url,
            },
            { status: res.status }
          );
        }
      } catch (err) {
        lastError = err;
        clearTimeout(timeoutId);
        // abort veya network hatasında diğer yolu dene
      }
    }

    const failMessage =
      lastError?.name === "AbortError"
        ? "QR QRGATEINFO API zaman aşımı"
        : "QR QRGATEINFO API'ye bağlanılamadı veya endpoint bulunamadı";
    return NextResponse.json(
      {
        success: false,
        message: failMessage,
        tried: candidateUrls,
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("QR QRGATEINFO API error:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası oluştu" }, { status: 500 });
  }
}