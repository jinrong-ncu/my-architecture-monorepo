/**
 * scripts/release.ts
 *
 * 企业级"一键换皮"自动发版引擎
 * ─────────────────────────────────────────────────────────────────
 * 使用场景：
 *   同一套脚手架代码库，为不同企业客户发布独立命名的 npm 包。
 *   例如：@a-company/cli（指令: a-cli）、@b-company/cli（指令: b-cli）
 *
 * 生命周期：
 *   询问参数 → 修改 CLI package.json → 全量 Turbo 构建（含模版拷贝）
 *   → npm publish → 还原 package.json（保持本地仓库干净）
 *
 * 使用方式：
 *   tsx scripts/release.ts
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

// ──────────────────────────────────────────────
// 路径常量
// ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONOREPO_ROOT = path.resolve(__dirname, '..');
const CLI_PKG_PATH = path.join(MONOREPO_ROOT, 'packages', 'cli', 'package.json');

// ──────────────────────────────────────────────
// 工具函数：带颜色的日志（无需 chalk 依赖）
// ──────────────────────────────────────────────
const log = {
    info: (msg: string) => console.log(`\n\x1b[36mℹ️  ${msg}\x1b[0m`),
    success: (msg: string) => console.log(`\n\x1b[32m✅  ${msg}\x1b[0m`),
    warn: (msg: string) => console.log(`\n\x1b[33m⚠️  ${msg}\x1b[0m`),
    error: (msg: string) => console.error(`\n\x1b[31m❌  ${msg}\x1b[0m`),
    step: (n: number, msg: string) => console.log(`\n\x1b[1m\x1b[35m── 步骤 ${n}：${msg} ──\x1b[0m`),
};

async function main() {
    console.log('\n🚀  欢迎使用企业级一键换皮发版引擎\n');

    // ══════════════════════════════════════════
    // 步骤一：交互询问发版参数
    // ══════════════════════════════════════════
    log.step(1, '收集发版参数');

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'binName',
            message: '请输入本次发布的脚手架指令名称（如：a-cli）：',
            validate: (v: string) => v.trim() ? true : '指令名称不能为空',
        },
        {
            type: 'input',
            name: 'pkgName',
            message: '请输入 NPM 包名称（如：@a-company/cli）：',
            validate: (v: string) => v.trim() ? true : 'NPM 包名称不能为空',
        },
        {
            type: 'input',
            name: 'version',
            message: '请输入发布版本号（留空则保持 package.json 现有版本）：',
        },
        {
            type: 'confirm',
            name: 'dryRun',
            message: '是否执行 dry-run 模拟发布（不真正推送至 npm）？',
            default: false,
        },
    ]);

    const { binName, pkgName, version, dryRun } = answers;

    // ══════════════════════════════════════════
    // 步骤二：备份并修改 CLI package.json
    // ══════════════════════════════════════════
    log.step(2, '修改 CLI package.json');

    // 读取并备份原始内容（发布后用于还原）
    const originalPkg = await fs.readJson(CLI_PKG_PATH);
    const originalPkgStr = JSON.stringify(originalPkg, null, 4);

    // 深拷贝后修改（避免污染 originalPkg 引用）
    const modifiedPkg = JSON.parse(originalPkgStr);
    modifiedPkg.name = pkgName.trim();
    modifiedPkg.bin = { [binName.trim()]: 'dist/index.js' };
    if (version?.trim()) {
        modifiedPkg.version = version.trim();
    }

    // 确保 npm publish 时包含 dist 和 templates
    modifiedPkg.files = ['dist', 'templates'];

    log.info(`包名：${originalPkg.name}  →  ${modifiedPkg.name}`);
    log.info(`指令：${Object.keys(originalPkg.bin ?? {})[0] ?? '(无)'}  →  ${binName}`);
    log.info(`版本：${originalPkg.version}  →  ${modifiedPkg.version}`);

    await fs.writeJson(CLI_PKG_PATH, modifiedPkg, { spaces: 4 });
    log.success('package.json 修改完成');

    // ══════════════════════════════════════════
    // 步骤三 ~ 四：构建 + 发布
    // ══════════════════════════════════════════
    try {
        // ── 步骤三：全量 Turbo 构建（含 copy-templates） ──
        log.step(3, '全量构建（pnpm turbo run build）');
        log.info('此步骤将编译 @rong/ui-vue + @rong/cli 并同步模版，请稍候...');

        execSync('pnpm turbo run build', {
            cwd: MONOREPO_ROOT,
            stdio: 'inherit', // 将构建日志实时透传到当前终端
        });
        log.success('全量构建完成');

        // ── 步骤四：发布到 npm ───────────────────────
        log.step(4, `发布到 npm（${dryRun ? 'dry-run 模式' : '正式发布'}）`);

        const publishCmd = dryRun
            ? 'npm publish --access public --dry-run'
            : 'npm publish --access public';

        log.info(`执行：${publishCmd}`);
        execSync(publishCmd, {
            cwd: path.join(MONOREPO_ROOT, 'packages', 'cli'),
            stdio: 'inherit', // 发布日志实时可见
        });

        log.success(dryRun
            ? 'Dry-run 完成，未真正发布。请去掉 dry-run 后重新执行以正式发版。'
            : `🎉  发布成功！现在可以运行 \`npx ${pkgName} create <project-name>\` 来使用你的脚手架！`
        );

    } catch (err: any) {
        // 构建或发布失败时，先还原后退出
        log.error(`构建/发布失败：${err.message ?? err}`);
        log.warn('开始还原 package.json...');
        await fs.writeFile(CLI_PKG_PATH, originalPkgStr, 'utf-8');
        log.success('package.json 已还原');
        process.exit(1);
    }

    // ══════════════════════════════════════════
    // 步骤五：还原 package.json（保持本地仓库干净）
    // ══════════════════════════════════════════
    log.step(5, '还原 package.json');

    await fs.writeFile(CLI_PKG_PATH, originalPkgStr, 'utf-8');
    log.success('package.json 已还原为发布前的状态，本地仓库保持干净');

    console.log('\n🏁  发版流程全部完成！\n');
}

main().catch(err => {
    log.error(`发版脚本意外退出：${err}`);
    process.exit(1);
});
