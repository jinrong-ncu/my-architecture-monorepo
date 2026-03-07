import * as fs from 'fs';
import * as path from 'path';

/**
 * 企业级一键架构前缀更名自动化脚本
 * 遍历并修改 packages 目录下所有模块的 package.json 名称前缀（无感更名实现）
 * 使用方式: npx ts-node scripts/rename.ts @a-company/
 */

const targetPrefix = process.argv[2];

if (!targetPrefix || !targetPrefix.endsWith('/')) {
    console.error('❌ 请提供有效的目标企业前缀, 例如: npx ts-node scripts/rename.ts @a-company/');
    process.exit(1);
}

// 确保目录获取准确，不论从哪里执行该脚本，都以脚本所在目录上一级为基准
const packagesDir = path.resolve(__dirname, '../packages');

function renamePackages() {
    if (!fs.existsSync(packagesDir)) {
        console.warn(`⚠️ 无法找到目标目录: ${packagesDir}`);
        return;
    }

    const dirs = fs.readdirSync(packagesDir);
    let changedCount = 0;

    dirs.forEach((dirName) => {
        // 过滤掉非目录的文件，例如 .DS_Store
        const dirPath = path.join(packagesDir, dirName);
        if (!fs.statSync(dirPath).isDirectory()) return;

        const pkgPath = path.join(dirPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
            try {
                const pkg = JSON.parse(pkgContent);
                const oldName = pkg.name;

                // 只有匹配到默认的架构占位前缀 @rong/ 才进行替换
                if (oldName && oldName.startsWith('@rong/')) {
                    const newName = oldName.replace('@rong/', targetPrefix);
                    pkg.name = newName;

                    // 写回 package.json（保留 2 个空格的缩进与结尾换行）
                    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
                    console.log(`✅ 已将子包 ${oldName} 重命名为 ${newName}`);
                    changedCount++;
                }
            } catch (e) {
                console.error(`❌ 解析或写入失败: ${pkgPath}`, e);
            }
        }
    });

    if (changedCount > 0) {
        console.log(`🎉 批量无感重命名完成！共影响 ${changedCount} 个包。`);
    } else {
        console.log(`ℹ️ 没有发现需要更名的包（未包含 @rong/ 前缀）。`);
    }
}

// 启动执行
renamePackages();
