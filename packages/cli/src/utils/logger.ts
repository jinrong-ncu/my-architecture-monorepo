import pc from 'picocolors';
import { pkgInfo } from './pkg';

/**
 * 封装带品牌前缀的全局日志工具 (logger)。
 * 此处使用 picocolors 替代 chalk，获得更快的执行速度并减小依赖体积，
 * 同时满足控制台终端颜色输出需求。
 */
class Logger {
    private get prefix() {
        // 前缀采用青色 (cyan) ，强调企业的品牌感与专业感
        return pc.cyan(pkgInfo.cliPrefix);
    }

    /**
     * 打印普通信息类型的日志
     */
    public info(msg: string) {
        console.log(`${this.prefix} ${pc.blue('INFO')} ${msg}`);
    }

    /**
     * 打印成功类型的绿字日志
     */
    public success(msg: string) {
        console.log(`${this.prefix} ${pc.green('SUCCESS')} ${msg}`);
    }

    /**
     * 打印警告类型的黄字日志
     */
    public warn(msg: string) {
        console.warn(`${this.prefix} ${pc.yellow('WARN')} ${msg}`);
    }

    /**
     * 打印失败 / 错误类型的红字日志，并支持打印抛出的原错误栈
     */
    public error(msg: string, err?: any) {
        console.error(`${this.prefix} ${pc.red('ERROR')} ${msg}`);
        if (err) {
            console.error(pc.red(err.stack || err.toString()));
        }
    }
}

export const logger = new Logger();
