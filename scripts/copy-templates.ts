/**
 * scripts/copy-templates.ts
 *
 * 构建后模版拷贝脚本
 * ─────────────────────────────────────────────────
 * 解决问题：npm publish 只发布 packages/cli 目录，
 * 而模版文件存放在 Monorepo 根目录的 templates/ 下。
 * 每次 CLI 构建完成后，此脚本将模版完整同步到
 * packages/cli/templates/，使 npm 发布时模版随包一起上传。
 *
 * 使用方式：
 *   tsx ../../scripts/copy-templates.ts   （从 packages/cli 下执行）
 *   或在 package.json build 脚本末尾链接此命令
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ──────────────────────────────────────────────
// 路径解析（ESM 下无 __dirname，需手动推导）
// ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Monorepo 根目录（scripts/ 的父目录） */
const MONOREPO_ROOT = path.resolve(__dirname, '..');

/** 源：根目录下的 templates/ */
const SRC_TEMPLATES = path.join(MONOREPO_ROOT, 'templates');

/** 目标：packages/cli/templates/ */
const DEST_TEMPLATES = path.join(MONOREPO_ROOT, 'packages', 'cli', 'templates');

async function main() {
    console.log('\n📦  开始同步模版文件...');

    // ── 1. 检查源目录是否存在 ──────────────────────
    const srcExists = await fs.pathExists(SRC_TEMPLATES);
    if (!srcExists) {
        console.error(`❌  源目录不存在：${SRC_TEMPLATES}`);
        process.exit(1);
    }

    // ── 2. 清空目标目录（防止残留旧模版污染） ───────
    if (await fs.pathExists(DEST_TEMPLATES)) {
        console.log(`🗑️   清空旧目标目录：${DEST_TEMPLATES}`);
        await fs.emptyDir(DEST_TEMPLATES);
    } else {
        // 目标目录不存在时自动创建
        await fs.ensureDir(DEST_TEMPLATES);
    }

    // ── 3. 拷贝 templates/ → packages/cli/templates/ ──
    console.log(`📂  拷贝：${SRC_TEMPLATES}  →  ${DEST_TEMPLATES}`);
    await fs.copy(SRC_TEMPLATES, DEST_TEMPLATES, {
        // 跳过 node_modules（模版开发时可能会有安装）
        filter: (src) => !src.includes('node_modules') && !src.includes('.DS_Store'),
    });

    // ── 4. 读取并统计拷贝了多少模版 ─────────────────
    const templates = await fs.readdir(DEST_TEMPLATES);
    console.log(`✅  同步完成！共包含 ${templates.length} 个模版：`);
    templates.forEach(t => console.log(`     • ${t}`));
    console.log('');
}

main().catch(err => {
    console.error('❌  copy-templates 执行失败：', err);
    process.exit(1);
});
