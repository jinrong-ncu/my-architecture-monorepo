#!/usr/bin/env node

/**
 * 脚手架程序的系统入口 (Entry Point)
 * 依赖 commander 实现多指令的装载解析分发
 */
import { Command } from 'commander';
import { pkgInfo } from './utils/pkg';
import { logger } from './utils/logger';
import { createAction } from './commands/create';

const program = new Command();

// --- 步骤一：基础全局属性动态绑定 ---
// 脚手架名称、用法展示与版本号读取，都从动态加载的 pkgInfo 内实时提取
program
    .name(pkgInfo.commandName)
    .usage('<command> [options]')
    .description('高度可定制企业级 Monorepo 前端架构核心脚手架驱动工具')
    .version(pkgInfo.version, '-v, --version', `查看 ${pkgInfo.commandName} 的当前版本号`);

// --- 步骤二：指令分枝注册 ---

/**
 * 注册核心底层命令：create
 * <app-name> 必填项，用来指定初始化的子目录或应用名字
 */
program
    .command('create <app-name>')
    .description('基于规范模板快速创建一个新的企业级前端工程')
    .action((appName: string) => {
        // 命中指令后转交具体 controller 层函数负责调度逻辑
        createAction(appName);
    });

// --- 步骤三：未匹配指令的兜底拦截 ---
program.on('command:*', ([cmd]) => {
    logger.error(`致命错误：您输入的命令 \`${cmd}\` 不存在，请检查拼写。`);
    // 输出系统全局帮助手册给操作员指导
    program.outputHelp();
    process.exit(1);
});

// --- 步骤四：执行解析触发指令链 ---
program.parse(process.argv);
