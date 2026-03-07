// 业务依赖于 axios 构建的企业级请求层
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 核心网络请求基类封装（提供泛型支持，可被 Vue/React 应用直接继承使用）
 * 集中管理网络请求拦截、响应脱壳、统一错误处理
 */
export class CoreHttpClient {
    private instance: AxiosInstance;

    constructor(config: AxiosRequestConfig) {
        this.instance = axios.create(config);
        this.setupInterceptors();
    }

    /**
     * 安装内置拦截逻辑
     */
    private setupInterceptors(): void {
        // 注入请求拦截器
        this.instance.interceptors.request.use(
            (config) => {
                // 在此处动态注入 Authorization Token 等业务鉴权信息
                return config;
            },
            (error) => Promise.reject(error)
        );

        // 注入响应拦截器
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                // 全局响应拆包处理，提取真正的业务 data 面板
                return response.data;
            },
            (error) => {
                // 全局网络错误日志收集、埋点上报，或统一弹窗提示等通用逻辑
                return Promise.reject(error);
            }
        );
    }

    // 暴露标准 Restful 方法供外部继承或直接使用
    public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.get(url, config);
    }

    public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.post(url, data, config);
    }
}

// 提供一个默认实例以备快速引入
export const httpClient = new CoreHttpClient({
    baseURL: '/api',
    timeout: 10000
});
