import fs from 'fs-extra';
import path from 'path';

/**
 * 拷贝前端模板代码并动态注入项目变量核心逻辑
 * 
 * @param templateName 用户选择的底层模板名称，如 vue3-vite-admin
 * @param appName 用户输入的期望项目名
 * @param targetPath 物理写入的目标绝对路径
 */
export async function copyTemplate(templateName: string, appName: string, targetPath: string) {
    // 1. 计算模板在 cli 包内的物理绝对路径
    // 根据编译后的 dist/utils/template.js 的所在位置
    // 向上寻找两级：dist(1) -> cli根目录(2) -> templates
    const templateDir = path.resolve(__dirname, '../../templates', templateName);

    // 防御性校验：模板是否存在
    if (!fs.existsSync(templateDir)) {
        throw new Error(`无法找到目标模板目录: ${templateDir}`);
    }

    // 2. 将模板根目录的所有静态与工程化文件，全量物理拷贝至用户工作区
    await fs.copy(templateDir, targetPath);

    // 3. 核心变量注入 (Variable Injection)
    // 按照业内惯例，提取出 package.json，将占位符替换成实际包名
    const pkgPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        let pkgContent = await fs.readFile(pkgPath, 'utf-8');
        // 假设模板采用 {{name}} 作为约定俗成甚至与 Vue-Cli / Vite 风格对齐的名称占位符
        pkgContent = pkgContent.replace(/\{\{name\}\}/g, appName);

        await fs.writeFile(pkgPath, pkgContent, 'utf-8');
    }

    // 4. (可选延伸) 如果包含入口渲染 HTML 页面也可以对其 <title>{{name}}</title> 等内容注入替换
    const indexPath = path.join(targetPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        let indexContent = await fs.readFile(indexPath, 'utf-8');
        indexContent = indexContent.replace(/\{\{name\}\}/g, appName);
        await fs.writeFile(indexPath, indexContent, 'utf-8');
    }
}
