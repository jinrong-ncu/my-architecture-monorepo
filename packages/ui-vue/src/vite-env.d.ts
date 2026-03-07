/**
 * Vite import.meta.env 类型补充（不依赖 vite 包本身）
 * 使 ui-vue 内部的代码能正确识别 VITE_ 前缀的环境变量
 */
interface ImportMeta {
    readonly env: {
        readonly VITE_S3_ACCESS_KEY_ID?: string;
        readonly VITE_S3_SECRET_ACCESS_KEY?: string;
        readonly VITE_S3_ENDPOINT?: string;
        readonly VITE_S3_REGION?: string;
        readonly VITE_S3_BUCKET?: string;
        readonly VITE_S3_PUBLIC_DOMAIN?: string;
        readonly [key: string]: string | undefined;
    };
}
