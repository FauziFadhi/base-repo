export interface SequelizeCacheModuleOptions {
  /**
   *  in Seconds 
  */
  defaultTTL: number;

  /** show log */
  logging?: boolean;

  log?: (value: any) => void;

  /** 
   * use provider value from this closure for create cache 
   * */
  callbackSet: ({ key, value, ttl }: { key: string, value: string, ttl: number }) => Promise<unknown>

  /**
   * use provider key for getting the cache 
   */
  callbackGet: ({ key }: { key: string }) => Promise<string>,

  /**
   * use provider key for invalidate cache 
   */
  callbackInvalidate: ({ key }: { key: string }) => unknown,

  /**
   * use provider key pattern for searching key 
   */
  callbackGetKey: ({ keyPattern }: { keyPattern: string }) => Promise<any>
}