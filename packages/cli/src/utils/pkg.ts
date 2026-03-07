import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * 动态读取并导出当前 CLI 的 package.json 内容。
 * 不写死包名、指令名及版本，完全遵循“无感更名”的架构设计原则。
 */
export function getPkgInfo() {
    try {
        // 假设编译后处于 dist/utils/pkg.js，向上两级找到 CLI 根目录的 package.json
        const pkgPath = resolve(__dirname, '../../package.json');
        const pkgContent = readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);

        // 动态提取指令名称 (如 rong-cli)
        const commandName = pkg.bin ? Object.keys(pkg.bin)[0] : 'rong-cli';

        return {
            name: pkg.name || '@rong/cli',
            version: pkg.version || '1.0.0',
            commandName,
            cliPrefix: `[${commandName.toUpperCase()}]`
        };
    } catch (err) {
        // 如果读取失败，进行降级容错以保证程序仍可运行
        return {
            name: '@rong/cli',
            version: '1.0.0',
            commandName: 'rong-cli',
            cliPrefix: '[RONG-CLI]'
        };
    }
}

// 导出一个单例实例供全局使用
export const pkgInfo = getPkgInfo();
