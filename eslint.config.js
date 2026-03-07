/** @type {import('eslint').Linter.Config} */
module.exports = {
    // 定义为此项目中 ESLint 的生效根目录，停止向父级目录查找 ESLint 规则
    root: true,
    env: {
        // 支持浏览器端的全局变量注入识别（如 window, document）
        browser: true,
        // 支持 Nodejs 服务端环境变量的全局注入（如 process, __dirname）
        node: true,
        // 支持较新的 ECMAScript 语法定义
        es2021: true
    },
    // 继承一系列由社区推荐维护的极高使用率基准配置插件
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // 结合 prettier 格式化以消除冲突，需放到最后一位覆盖规则
        'plugin:prettier/recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    // 覆盖特定的企业级规则参数
    rules: {
        // 针对泛型的极度灵活场景，给予 any 类型的降级容忍，但警告提示（业务按需再严格卡死）
        '@typescript-eslint/no-explicit-any': 'warn',
        // 为了和 Prettier 进行结合
        'prettier/prettier': [
            'error',
            {
                // 强制单引号
                singleQuote: true,
                // 是否添加行尾分号
                semi: true,
                // 对象和数组等最后一个元素强制没有尾随逗号
                trailingComma: 'none'
            }
        ]
    }
};
