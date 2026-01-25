export interface Cache {
    get(key: string): Promise<Uint8Array | null>;
    set(key: string, data: Uint8Array): Promise<void>;
}