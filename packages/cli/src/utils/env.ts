import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * 动态读取并暴露脚手架核心信息的环境变量工具（即“无感更名”实现基础）
 */
function getCliBaseInfo() {
    try {
        // 动态定位上层 package.json 的相对位置 (基于具体构建后产物结构灵活调整)
        const pkgPath = resolve(__dirname, '../../package.json');
        const pkgContent = readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);

        // 取出 bin 对象声明的第一项指令名作为 CLI 前缀（如 rongshiyi-cli / a-company-cli）
        // 实现了只改 package.json 甚至由脚本修改 pkg 前缀后代码内能自动更新
        const commandName = pkg.bin ? Object.keys(pkg.bin)[0] : 'rongshiyi-cli';

        return {
            version: pkg.version as string,
            cliName: commandName,
            cliPrefix: `[${commandName.toUpperCase()}]`
        };
    } catch (err) {
        // 降级兼容策略，防止因目录解析失败导致脚手架彻底崩溃
        return {
            version: '1.0.0',
            cliName: 'rongshiyi-cli',
            cliPrefix: '[RONGSHIYI-CLI]'
        };
    }
}

// 导出单例以便全局公用环境变量
export const cliEnv = getCliBaseInfo();

/**
 * 通用日志函数，自动带上当前已根据 package.json 动态解析出来的 CLI 专属前缀
 */
export function logInfo(msg: string) {
    // eslint 规则若开启了 no-console 时使用如下防爆标记
    // eslint-disable-next-line no-console
    console.log(`${cliEnv.cliPrefix} INFO: ${msg}`);
}
