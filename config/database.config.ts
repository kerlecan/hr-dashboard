// services/apiConfig.ts
export class ApiConfigService {
  // Database adlarına göre URL mapping
  private static readonly DB_URL_MAP: Record<string, string> = {
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

  // Port numaralarına göre URL mapping
  private static readonly PORT_URL_MAP: Record<number, string> = {
    3009: "http://ik.hominum.info:3009",
    3019: "http://ik.hominum.info:3019",
    3029: "http://ik.hominum.info:3029",
    3039: "http://ik.hominum.info:3039",
    3049: "http://ik.hominum.info:3049",
    3059: "http://ik.hominum.info:3059",
    3069: "http://ik.hominum.info:3069",
    3079: "http://ik.hominum.info:3079",
    3089: "http://ik.hominum.info:3089",
    3099: "http://ik.hominum.info:3099",
    3109: "http://ik.hominum.info:3109",
    3119: "http://ik.hominum.info:3119",
    3129: "http://ik.hominum.info:3129",
    3139: "http://ik.hominum.info:3139",
    3149: "http://ik.hominum.info:3149",
    3159: "http://ik.hominum.info:3159",
    3169: "http://ik.hominum.info:3169",
    3179: "http://ik.hominum.info:3179",
    3189: "http://ik.hominum.info:3189",
    3199: "http://ik.hominum.info:3199",
    3209: "http://ik.hominum.info:3209",
    3219: "http://ik.hominum.info:3219"
  };

  // Global API bilgileri
  private static globalApiInfo: {
    dbName: string;
    dbPort: number;
    apiBaseUrl: string;
    userProfile: string;
    username: string;
  } | null = null;

  /**
   * Global API bilgilerini ayarla
   */
  static setGlobalApiInfo(info: {
    dbName: string;
    dbPort: number;
    apiBaseUrl: string;
    userProfile: string;
    username: string;
  }) {
    this.globalApiInfo = info;
    if (typeof window !== 'undefined') {
      localStorage.setItem('globalApiInfo', JSON.stringify(info));
    }
  }

  /**
   * Global API bilgilerini getir
   */
  static getGlobalApiInfo() {
    if (this.globalApiInfo) {
      return this.globalApiInfo;
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('globalApiInfo');
      if (stored) {
        try {
          this.globalApiInfo = JSON.parse(stored);
          return this.globalApiInfo;
        } catch (e) {
          console.error('Global API info parse hatası:', e);
          localStorage.removeItem('globalApiInfo');
        }
      }
    }

    return null;
  }

  /**
   * DB Name'e göre URL getir
   */
  static getUrlByDbName(dbName: string): string {
    console.log('[ApiConfig] getUrlByDbName çağrıldı:', dbName);
    
    if (!dbName) {
      console.error('[ApiConfig] DB Name boş');
      throw new Error('DB Name belirtilmedi');
    }

    const normalizedDbName = dbName.toUpperCase().trim();
    console.log('[ApiConfig] Normalized DB Name:', normalizedDbName);

    const url = this.DB_URL_MAP[normalizedDbName];
    
    if (!url) {
      console.error('[ApiConfig] URL bulunamadı:', normalizedDbName);
      throw new Error(`"${dbName}" veritabanı için URL tanımlı değil`);
    }
    
    console.log('[ApiConfig] URL bulundu:', url);
    return url;
  }

  /**
   * Port'a göre URL getir
   */
  static getUrlByPort(port: number): string {
    console.log('[ApiConfig] getUrlByPort çağrıldı:', port);
    
    const url = this.PORT_URL_MAP[port];
    
    if (!url) {
      console.error('[ApiConfig] Port için URL bulunamadı:', port);
      throw new Error(`${port} portu için URL bulunamadı`);
    }
    
    return url;
  }

  /**
   * API Base URL'i getir (global olarak kayıtlı)
   */
  static getApiBaseUrl(): string {
    const globalInfo = this.getGlobalApiInfo();
    
    if (globalInfo?.apiBaseUrl) {
      return globalInfo.apiBaseUrl;
    }
    
    throw new Error('Global API bilgileri ayarlanmamış. Önce kullanıcı girişi yapılmalı.');
  }

  /**
   * Tam API URL'i oluştur
   */
  static buildApiUrl(endpoint: string): string {
    const baseUrl = this.getApiBaseUrl();
    
    // Endpoint / ile başlamıyorsa ekle
    const normalizedEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
    
    return `${baseUrl}/butunbiApi/api${normalizedEndpoint}`;
  }

  /**
   * Tüm API bilgilerini temizle
   */
  static clearApiInfo() {
    this.globalApiInfo = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('globalApiInfo');
    }
  }

  /**
   * Tüm DB listesini getir (debug için)
   */
  static getAllDatabases(): string[] {
    return Object.keys(this.DB_URL_MAP);
  }

  /**
   * DB adı geçerli mi kontrol et
   */
  static isValidDatabase(dbName: string): boolean {
    const normalizedDbName = dbName.toUpperCase().trim();
    return !!this.DB_URL_MAP[normalizedDbName];
  }
}