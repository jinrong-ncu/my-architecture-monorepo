/**
 * scripts/release.ts
 *
 * 通用多包发布引擎 (Multi-package Release Engine)
 * ─────────────────────────────────────────────────────────────────
 * 该脚本支持 Monorepo 中 packages/* 下所有包的选择性发布。
 * 扁平化架构设计：包名统一以 rongshiyi- 前缀。
 * 支持“换皮”发布：发布时可修改包名、指令名，并自动同步到 templates/。
 * 强隔离保证：无论成功失败，所有被动态修改的文件在流程结束时会被完全还原。
 *
 * 使用方式：tsx scripts/release.ts
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

// ──────────────────────────────────────────────────────────────────
// 1. 路径与常量配置
// ──────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// 彩色日志输出
const log = {
    info: (msg: string) => console.log(`\n\x1b[36mℹ️  ${msg}\x1b[0m`),
    success: (msg: string) => console.log(`\n\x1b[32m✅  ${msg}\x1b[0m`),
    warn: (msg: string) => console.log(`\n\x1b[33m⚠️  ${msg}\x1b[0m`),
    error: (msg: string) => console.error(`\n\x1b[31m❌  ${msg}\x1b[0m`),
    step: (n: number | string, msg: string) =>
        console.log(`\n\x1b[1m\x1b[35m── 步骤 ${n}：${msg} ──\x1b[0m`),
};

// ──────────────────────────────────────────────────────────────────
// 2. 类型定义
// ──────────────────────────────────────────────────────────────────
interface PackageInfo {
    dirName: string;      // 目录名，如 ui-vue
    pkgPath: string;      // package.json 路径
    currentName: string;  // 当前包名，如 rongshiyi-ui-vue
    currentVersion: string;
    originalJson: string; // 备份原始内容用于还原
}

interface Snapshot {
    filePath: string;
    originalContent: string;
}

// ──────────────────────────────────────────────────────────────────
// 3. 核心工具函数
// ──────────────────────────────────────────────────────────────────

/** 扫描 packages 目录获取所有包信息 */
async function scanPackages(): Promise<PackageInfo[]> {
    const dirs = await fs.readdir(PACKAGES_DIR);
    const results: PackageInfo[] = [];

    for (const dir of dirs) {
        const pkgPath = path.join(PACKAGES_DIR, dir, 'package.json');
        if (!(await fs.pathExists(pkgPath))) continue;

        const pkg = await fs.readJson(pkgPath);
        results.push({
            dirName: dir,
            pkgPath,
            currentName: pkg.name,
            currentVersion: pkg.version,
            originalJson: JSON.stringify(pkg, null, 4),
        });
    }
    return results;
}

/** 递归扫描文件 */
async function collectFiles(dir: string, exts: string[]): Promise<string[]> {
    const results: string[] = [];
    if (!(await fs.pathExists(dir))) return results;

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            results.push(...await collectFiles(fullPath, exts));
        } else if (exts.some(ext => entry.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

/** 
 * 自动化关联更正：替换模版中的依赖名与源码中的 import 路径 
 */
async function bridgeTemplates(oldName: string, newName: string): Promise<Snapshot[]> {
    const snapshots: Snapshot[] = [];

    // 1. 扫描所有模板的 package.json
    const pkgFiles = await collectFiles(TEMPLATES_DIR, ['.json']);
    for (const file of pkgFiles) {
        if (!file.endsWith('package.json')) continue;

        const content = await fs.readFile(file, 'utf-8');
        if (content.includes(`"${oldName}"`)) {
            snapshots.push({ filePath: file, originalContent: content });
            // 替换依赖名
            const updated = content.split(`"${oldName}"`).join(`"${newName}"`);
            await fs.writeFile(file, updated, 'utf-8');
            log.info(`[模板依赖同步] ${path.relative(ROOT, file)}`);
        }
    }

    // 2. 扫描所有模板的源码文件 (vue, ts, js) 替换 import 路径
    const srcFiles = await collectFiles(TEMPLATES_DIR, ['.vue', '.ts', '.js', '.tsx']);
    // 匹配 from 'rongshiyi-ui-vue' 或 from "rongshiyi-ui-vue"
    const importRegex = new RegExp(`(['"])${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g');

    for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf-8');
        if (importRegex.test(content)) {
            snapshots.push({ filePath: file, originalContent: content });
            const updated = content.replace(importRegex, `$1${newName}$2`);
            await fs.writeFile(file, updated, 'utf-8');
            log.info(`[源码引用同步] ${path.relative(ROOT, file)}`);
        }
    }

    return snapshots;
}

// ──────────────────────────────────────────────────────────────────
// 4. 主流程
// ──────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🚀  Monorepo 自动化多包发布系统\n');

    // ── 步骤 1: 扫描包 ─────────────────────────────────────────────
    log.step(1, '列出工作区成员');
    const packages = await scanPackages();
    if (packages.length === 0) {
        log.error('未在 packages/ 目录下找到有效包。');
        process.exit(1);
    }

    // ── 步骤 2: 用户配置 ───────────────────────────────────────────
    log.step(2, '交互式配置发布参数');

    const { targetDir } = await inquirer.prompt([
        {
            type: 'list',
            name: 'targetDir',
            message: '请选择要发布的项目包：',
            choices: packages.map(p => ({
                name: `${p.currentName} (${p.dirName})`,
                value: p.dirName
            }))
        }
    ]);

    const targetPkg = packages.find(p => p.dirName === targetDir)!;

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'publishName',
            message: `请输入发布到 NPM 的包名：`,
            // 默认前缀 rongshiyi- 加上原目录名，如果原来的就是这个名字（扁平化的），则直接使用
            default: `rongshiyi-${targetDir}`,
        },
        // 如果是 CLI，单独询问 bin 指令名
        ...(targetDir === 'cli' ? [{
            type: 'input',
            name: 'binName',
            message: '请输入脚手架指令名称 (bin key)：',
            default: targetPkg.currentName === 'rongshiyi-cli' ? 'rongshiyi-cli' : 'rongshiyi-cli',
        }] : []),
        {
            type: 'input',
            name: 'version',
            message: `请输入发布版本号 (当前 ${targetPkg.currentVersion})：`,
            default: targetPkg.currentVersion,
        },
        {
            type: 'confirm',
            name: 'dryRun',
            message: '是否开启 dry-run 模式 (仅模拟不发布)？',
            default: false,
        }
    ]);

    const { publishName, binName, version, dryRun } = answers;

    // 用于记录所有被修改的文件以便回滚
    const backupMap = new Map<string, string>();

    try {
        // ── 步骤 3: 预发布处理 (The Bridge) ────────────────────────
        log.step(3, '执行发布前置处理与关联更正');

        // A. 修改目标包的 package.json
        const pkgContent = JSON.parse(targetPkg.originalJson);
        pkgContent.name = publishName;
        pkgContent.version = version;

        // 强制包含必要的发布目录
        if (!pkgContent.files) pkgContent.files = [];
        if (!pkgContent.files.includes('dist')) pkgContent.files.push('dist');
        if (targetDir === 'cli' && !pkgContent.files.includes('templates')) pkgContent.files.push('templates');

        if (binName) {
            pkgContent.bin = { [binName]: 'dist/index.js' };
        }

        backupMap.set(targetPkg.pkgPath, targetPkg.originalJson);
        await fs.writeJson(targetPkg.pkgPath, pkgContent, { spaces: 4 });
        log.success(`[项目配置] 已更新 ${targetPkg.dirName} 的 package.json`);

        // B. 如果发的是 UI 库并且换了个名字，同步更新模版引用
        // 因为基础包名改成了 rongshiyi-ui-vue，我们以旧本地名 targetPkg.currentName 作为搜索基准。
        if (targetDir.startsWith('ui') && publishName !== targetPkg.currentName) {
            const templateSnaps = await bridgeTemplates(targetPkg.currentName, publishName);
            for (const snap of templateSnaps) {
                if (!backupMap.has(snap.filePath)) {
                    backupMap.set(snap.filePath, snap.originalContent);
                }
            }
            log.success(`[关联更正] 模版同步替换完成，共涉及 ${templateSnaps.length} 个文件`);
        }

        // ── 步骤 4: 构建项目 ────────────────────────────────────────
        log.step(4, `执行构建: ${publishName}`);

        // 使用 Turbo 进行精准构建 (使用目录路径过滤更稳健)
        const filterPath = `./packages/${targetDir}`;
        execSync(`pnpm turbo run build --filter ${filterPath}`, {
            cwd: ROOT,
            stdio: 'inherit'
        });

        // 如果是 CLI，构建后需要额外拷贝模版
        if (targetDir === 'cli') {
            log.info('正在为 CLI 同步最新模版文件...');
            execSync('tsx ../../scripts/copy-templates.ts', {
                cwd: path.join(PACKAGES_DIR, 'cli'),
                stdio: 'inherit'
            });
        }

        // ── 步骤 5: 执行发布 ────────────────────────────────────────
        log.step(5, `推送 NPM: ${publishName}@${version}`);

        const publishCmd = dryRun
            ? 'npm publish --access public --dry-run'
            : 'npm publish --access public';

        if (!dryRun) {
            log.warn('注意：如果这是你第一次发布该包：');
            log.info('1. 请确保你已执行过 `npm login`');
            log.info('2. 浏览器可能会弹出安全授权或请输入 OTP 验证码。');
        }

        execSync(publishCmd, {
            cwd: path.join(PACKAGES_DIR, targetDir),
            stdio: 'inherit'
        });

        log.success(dryRun ? '模拟发布成功！' : '🎉 发布流程圆满完成！');

    } catch (err: any) {
        log.error(`发布流程中断: ${err.message}`);
        process.exitCode = 1;
    } finally {
        // ── 步骤 6: 物理还原 (Cleanup) ─────────────────────────────
        log.step(6, '环境隔离：执行状态自动回滚');

        for (const [filePath, content] of backupMap.entries()) {
            await fs.writeFile(filePath, content, 'utf-8');
        }

        log.success(`已恢复 ${backupMap.size} 个文件的原始状态，保持 Git 净空。`);
        console.log('\n🏁 流程结束。\n');
    }
}

main().catch(err => {
    log.error(`脚本全局错误: ${err}`);
    process.exit(1);
});