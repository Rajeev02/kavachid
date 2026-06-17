export interface KavachCoreModuleOptions {
  databaseUrl: string;
  masterKey: string;
  webhookUrl?: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
}

export const KAVACH_CORE_OPTIONS = 'KAVACH_CORE_OPTIONS';
