declare module 'pdf-img-convert' {
    export function convert(
        pdf: string | Buffer | Uint8Array,
        conversion_config?: {
            width?: number;
            height?: number;
            page_numbers?: number[];
            base64?: boolean;
            scale?: number;
        }
    ): Promise<string[] | Buffer[]>;
}