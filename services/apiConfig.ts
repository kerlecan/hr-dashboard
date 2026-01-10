// services/apiConfig.ts
export class ApiConfigService {
  private static globalApiInfo: {
    dbName: string;
    dbPort: number;
    apiBaseUrl: string;
    userProfile: string;
    username: string;
  } | null = null;

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
        } catch {
          localStorage.removeItem('globalApiInfo');
        }
      }
    }

    return null;
  }

  static getApiBaseUrl(): string {
    const globalInfo = this.getGlobalApiInfo();
    
    if (globalInfo?.apiBaseUrl) {
      return globalInfo.apiBaseUrl;
    }
    
    throw new Error('API bilgileri ayarlanmamış. Önce giriş yapın.');
  }

  static buildApiUrl(endpoint: string): string {
    const baseUrl = this.getApiBaseUrl();
    
    const normalizedEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
    
    return `${baseUrl}/butunbiApi/api${normalizedEndpoint}`;
  }

  static clearApiInfo() {
    this.globalApiInfo = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('globalApiInfo');
    }
  }

  static getUrlByDbName(dbName: string): string {
    const globalInfo = this.getGlobalApiInfo();
    if (globalInfo?.dbName === dbName && globalInfo?.apiBaseUrl) {
      return globalInfo.apiBaseUrl;
    }
    throw new Error(`"${dbName}" veritabanı için URL bulunamadı`);
  }
}