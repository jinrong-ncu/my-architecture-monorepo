import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { RequestOption } from '@arco-design/web-vue';

// ==========================================
// 遗留的多云配置类型（保留向后兼容）
// ==========================================
export interface OSSConfig {
    vendor: 's3' | 'aliyun';
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
    publicDomain?: string;
    stsEndpoint?: string;
}

// ==========================================
// 新增：Cloudflare R2 / S3 兼容专用配置
// ==========================================
export interface S3UploaderConfig {
    accessKeyId: string;
    secretAccessKey: string;
    /** R2 / S3 兼容端点，如 https://<accountId>.r2.cloudflarestorage.com */
    endpoint: string;
    /** Cloudflare R2 固定填 'auto'；标准 S3 填区域如 'us-east-1' */
    region?: string;
    /** 存储桶名称 */
    bucket: string;
    /** 文件对外访问的公开域名（绑定在 R2 上的自定义域名） */
    publicDomain: string;
}

/**
 * createS3Uploader — 从环境变量初始化 Cloudflare R2 / S3 直传引擎
 *
 * 返回一个符合 `apiObj` 签名的上传函数，可直接传给 SingleUpload / MultipleUpload
 *
 * 使用方式：
 *   const realUploadApi = createS3Uploader();  // 自动读取 VITE_S3_* 环境变量
 *   <SingleUpload :api-obj="realUploadApi" />
 */
export function createS3Uploader(config?: Partial<S3UploaderConfig>) {
    // 使用 (import.meta as any).env 读取 Vite 注入的环境变量
    // 注：ui-vue 包无独立 vite tsconfig，通过类型断言绕过 TS 检查，运行时由 Vite 正确注入
    const env = (import.meta as any).env ?? {};
    const resolvedConfig: S3UploaderConfig = {
        accessKeyId: config?.accessKeyId ?? env.VITE_S3_ACCESS_KEY_ID,
        secretAccessKey: config?.secretAccessKey ?? env.VITE_S3_SECRET_ACCESS_KEY,
        endpoint: config?.endpoint ?? env.VITE_S3_ENDPOINT,
        region: config?.region ?? (env.VITE_S3_REGION || 'auto'),
        bucket: config?.bucket ?? env.VITE_S3_BUCKET,
        publicDomain: config?.publicDomain ?? env.VITE_S3_PUBLIC_DOMAIN
    };

    // ==========================================
    // 初始化 S3 Client（兼容 Cloudflare R2 的 S3 协议）
    // 注意：
    //   1. R2 的 region 必须设为 'auto'
    //   2. endpoint 必须指向 R2 的 S3 兼容端点，不能使用默认 AWS 端点
    //   3. forcePathStyle 对 R2 通常不必须，但某些场景下需要开启
    // ==========================================
    const s3Client = new S3Client({
        region: resolvedConfig.region,
        endpoint: resolvedConfig.endpoint,
        credentials: {
            accessKeyId: resolvedConfig.accessKeyId,
            secretAccessKey: resolvedConfig.secretAccessKey
        }
    });

    // ==========================================
    // 返回符合 apiObj 签名的上传函数
    // 签名：(file: File, onProgress: (percent: number) => void) => Promise<string>
    // ==========================================
    return async function uploadToS3(
        file: File,
        onProgress: (percent: number) => void
    ): Promise<string> {
        // 生成唯一文件名：时间戳 + 随机串 + 原始文件名，防止同名文件覆盖
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).slice(2, 8);
        const safeFileName = file.name.replace(/[^\w.-]/g, '_');
        const objectKey = `uploads/${timestamp}-${randomSuffix}-${safeFileName}`;

        // ==========================================
        // 使用 @aws-sdk/lib-storage 的 Upload 类实现分片上传
        //
        // 相比 PutObjectCommand，Upload 的核心优势：
        //   1. 自动将大文件切分为多个分片（multipart upload），提高稳定性
        //   2. 通过 on('httpUploadProgress') 事件实时回报上传进度
        //   3. 内建重试机制，对弱网环境更友好
        // ==========================================
        const parallelUpload = new Upload({
            client: s3Client,
            params: {
                Bucket: resolvedConfig.bucket,
                Key: objectKey,
                Body: file,
                ContentType: file.type || 'application/octet-stream'
            },
            // 分片大小：5MB（S3 协议的最小分片限制）
            partSize: 5 * 1024 * 1024,
            // 并发分片数
            queueSize: 3
        });

        // 监听 httpUploadProgress 事件，将 loaded/total 换算为百分比回传进度条
        parallelUpload.on('httpUploadProgress', (progress) => {
            if (progress.loaded && progress.total) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                onProgress(percent);
            }
        });

        // 执行上传，等待完成
        await parallelUpload.done();

        // 拼接公开访问 URL（使用绑定在 R2 上的自定义域名，而非 R2 内部地址）
        const publicUrl = `${resolvedConfig.publicDomain.replace(/\/$/, '')}/${objectKey}`;
        return publicUrl;
    };
}

// ==========================================
// 向后兼容：保留原 useOSS hook（基于旧 OSSConfig 接口）
// ==========================================
export function useOSS(ossConfig: OSSConfig) {
    const customRequest = async (option: RequestOption) => {
        const { fileItem, onProgress, onSuccess, onError } = option;
        const file = fileItem.file!;

        if (ossConfig.vendor === 's3') {
            const uploader = createS3Uploader({
                accessKeyId: ossConfig.accessKeyId,
                secretAccessKey: ossConfig.accessKeySecret,
                endpoint: `https://s3.${ossConfig.region}.amazonaws.com`,
                region: ossConfig.region,
                bucket: ossConfig.bucket,
                publicDomain: ossConfig.publicDomain || ''
            });
            try {
                const url = await uploader(file, (p) => onProgress(p));
                onSuccess({ url });
            } catch (err) {
                onError(err as Error);
            }
        } else {
            // Aliyun 占位，逻辑与之前相同
            console.warn('[useOSS] Aliyun vendor 尚未接入真实 SDK');
            onError(new Error('Aliyun vendor not implemented'));
        }
    };
    return { customRequest };
}
