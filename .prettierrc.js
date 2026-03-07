/**
 * 企业级 Monorepo 中 Prettier 共享配置基础规则
 */
module.exports = {
    // 编辑器单行字符上线（到达此界限则会被自动折行）
    printWidth: 100,
    // 一个 Tab 的空格数等于2个空格
    tabWidth: 2,
    // 强制摒弃 Tab，一律替换为空格缩进
    useTabs: false,
    // 代码尾随分号开关
    semi: true,
    // 使用单引号而不是双引号包裹字符串
    singleQuote: true,
    // 只有对象当中的属性确切需要时，才给它加上引号
    quoteProps: 'as-needed',
    // 在 JSX 或 TSX 中，不采用单引号而是使用双引号
    jsxSingleQuote: false,
    // 在多行元素结尾时，不追加尾随逗号以避免某些旧语法的警告
    trailingComma: 'none',
    // 对象大括号内前后加上一个空格 `{ foo: bar }`
    bracketSpacing: true,
    // 单参数箭头函数的参数也会被加上扩号 `(x) => x`
    arrowParens: 'always',
    // 结合不同操作系统的行尾序列保持一致（统一 LF，避免 Windows/Mac 的 CRLF/LF 换行血案）
    endOfLine: 'lf'
};
