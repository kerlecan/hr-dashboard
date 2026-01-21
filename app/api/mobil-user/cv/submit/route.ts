import { NextRequest, NextResponse } from "next/server";

const DB_URL_MAP:  Record<string, string> = {
  NAVLUNGO: "http://ik.hominum. info:3009",
  TEMAWORLD: "http://ik.hominum. info:3019",
  SHERATONPENDIK: "http://ik.hominum. info:3029",
  ADDRESS: "http://ik.hominum. info:3039",
  MODAHILTON: "http://ik.hominum. info:3049",
  SWOT: "http://ik.hominum. info:3059",
  DUZGIT: "http://ik.hominum. info:3069",
  BLUPERA: "http://ik.hominum. info:3079",
  HOMINUM: "https://ik.hominum.info:3089",
  ANADOLUHOTELS: "http://ik.hominum. info:3099",
  GRUPTRANS: "http://ik.hominum. info:3109",
  SINANDURU: "http://ik.hominum. info:3119",
  BOTEK: "https://ik.hominum.info:3129",
  GOLDENTULIP: "https://ik.hominum.info:3139",
  GULSOY:  "https://ik.hominum.info:3149",
  CABA903: "http://ik.hominum. info:3159",
  GALLEY: "http://ik.hominum. info:3169",
  EFESAN: "https://ik.hominum.info:3179",
  EMAAR: "https://ik.hominum.info:3189",
  STAY: "http://ik.hominum. info:3199",
  QUBISH: "https://ik.hominum.info:3209",
  OTTOMARE: "https://ik.hominum.info:3219",
};

// CV başvuruları için varsayılan veritabanı
const DEFAULT_CV_DATABASE = "HOMINUM";

const API_TOKEN = process.env.API_TOKEN!;

async function tryFetch(
  url: string,
  body:  any,
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
    
    // CV başvuruları için varsayılan DB kullan (giriş yapmayan kullanıcılar için)
    const dbName = searchParams.get("dbName") 
      || request. headers.get("x-db-name") 
      || DEFAULT_CV_DATABASE;

    const normalizedDbName = dbName.toUpperCase().trim();
    const apiBaseUrl = DB_URL_MAP[normalizedDbName];
    
    if (!apiBaseUrl) {
      // Eğer belirtilen DB bulunamazsa varsayılan DB'yi kullan
      console.warn(`DB "${dbName}" bulunamadı, varsayılan DB (${DEFAULT_CV_DATABASE}) kullanılıyor`);
      const fallbackUrl = DB_URL_MAP[DEFAULT_CV_DATABASE];
      
      if (!fallbackUrl) {
        return NextResponse.json(
          { success: false, message:  "Veritabanı yapılandırma hatası" },
          { status: 500 }
        );
      }
    }

    const body = await request.json();

    // CV submit için validation
    if (!body?.cv || !body.cv.fullname || ! body.cv.email) {
      return NextResponse.json(
        { success:  false, message: "Ad Soyad ve E-posta alanları zorunludur" },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.cv.email)) {
      return NextResponse.json(
        { success: false, message: "Geçerli bir e-posta adresi giriniz" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "x-api-key": API_TOKEN,
      "Content-Type": "application/json",
    };

    // User context forward (opsiyonel - CV başvurularında olmayabilir)
    const userId = request.headers.get("x-user-id");
    if (userId) headers["x-user-id"] = userId;

    const targetUrl = `${apiBaseUrl || DB_URL_MAP[DEFAULT_CV_DATABASE]}/butunbiApi/api/mobil-user/cv/submit`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

    try {
      const res = await tryFetch(targetUrl, body, headers, controller.signal);
      clearTimeout(timeoutId);

      const text = await res.text();
      
      // Boş response kontrolü
      if (! text) {
        // Başarılı ama boş response (bazı API'ler sadece 200 döner)
        if (res.ok) {
          return NextResponse.json({ success: true, message: "CV başarıyla kaydedildi" });
        }
        return NextResponse.json(
          { success: false, message: "Sunucudan yanıt alınamadı" },
          { status: res.status }
        );
      }

      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status:  res.status });
      } catch {
        // JSON parse hatası - text olarak döndür
        if (res.ok) {
          return NextResponse.json({ success: true, message:  text });
        }
        return NextResponse. json(
          { success: false, message: text || "Beklenmeyen hata" },
          { status:  res.status }
        );
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err?. name === "AbortError") {
        return NextResponse.json(
          { success: false, message:  "İstek zaman aşımına uğradı.  Lütfen tekrar deneyin." },
          { status: 504 }
        );
      }
      
      console.error("CV Submit fetch error:", err);
      return NextResponse. json(
        { success: false, message: "Sunucuya bağlanılamadı.  Lütfen tekrar deneyin." },
        { status: 503 }
      );
    }
  } catch (error:  any) {
    console.error("CV Submit API error:", error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}