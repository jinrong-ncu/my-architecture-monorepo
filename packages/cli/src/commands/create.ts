import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'picocolors'; // 为了兼容 CJS 环境，使用 picocolors 替代原生高版本 chalk
import { logger } from '../utils/logger';
import { copyTemplate } from '../utils/template';

/**
 * create 指令的核心执行与交互逻辑
 * 负责收集用户填写的项目名、挑选脚手架模板并执行拷贝任务
 * 
 * @param projectName 解析得到的用户期望项目名称
 */
export async function createAction(projectName: string) {
    // 容错与防御性编程：如果未获取到项目名称，立即抛出友好的拦截提示
    if (!projectName) {
        logger.error('缺少项目名称！正确用法: create <app-name>');
        // 以异常状态码退出进程
        process.exit(1);
    }

    // 1. 命令前置检验：判断当前路径下是否已存在同名目录，若存在则防误删抛异常
    const targetPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(targetPath)) {
        logger.error(`当前目录已存在同名文件夹: ${chalk.cyan(projectName)}，请更换项目名或删除重试。`);
        process.exit(1);
    }

    logger.info(`正在准备创建企业级前端应用: ${chalk.cyan(projectName)}`);

    try {
        // 2. 交互询问：让用户选择所需要的业务模板
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'templateType',
                message: '请选择您想要初始化的基础前端模板:',
                choices: [
                    { name: 'Vue 3 中后台系统 (基于 Vue3 + Vite + Arco / Element Plus)', value: 'vue3-vite-admin' },
                    { name: 'React 18 中后台系统 (基于 React + Next.js + Antd / Arco)', value: 'react-next-admin' }
                ]
            }
        ]);

        const { templateType } = answers;

        logger.success(`您选择的开发模板是: ${chalk.cyan(templateType)}`);

        // 3. 执行拷贝与加载动画展示
        const spinner = ora('正在生成物理项目结构...').start();
        try {
            // 触发真正物理拷贝流转
            await copyTemplate(templateType, projectName, targetPath);
            spinner.succeed(chalk.green('项目结构与配置变量注入成功！'));
        } catch (err: any) {
            spinner.fail(chalk.red('项目结构生成与组装失败！'));
            logger.error('底层拷贝或变量注入时遇到未知错误:', err);
            process.exit(1);
        }

        // 4. 完成引导，提示操作者后续使用规则
        console.log();
        logger.success(`🎉 恭喜！全栈企业应用 ${chalk.cyan(projectName)} 骨架已生成完毕！`);
        console.log();
        console.log(chalk.gray('请参考以下步骤进入开发体验：'));
        console.log(chalk.cyan(`  cd ${projectName}`));
        console.log(chalk.cyan('  pnpm install'));
        console.log(chalk.cyan('  pnpm dev'));
        console.log();

    } catch (error) {
        logger.error('在创建项目交互过程中发生了意外中断', error);
        process.exit(1);
    }
}
