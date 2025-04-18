# DPML CLI 测试用例

本文档描述了`@dpml/cli`包的单元测试和集成测试用例，旨在确保CLI核心功能的正确性、稳定性和可用性。`@dpml/cli`作为DPML的命令行工具入口，负责发现、加载和执行各领域包的命令。

## 1. 命令注册与发现机制测试

| 测试ID   | 测试名称         | 测试意图                      | 预期结果               | 是否需要Mock |
| -------- | ---------------- | ----------------------------- | ---------------------- | ------------ |
| UT-C-001 | 基础注册表操作   | 测试CommandRegistry的基本操作 | 命令成功注册和检索     | 否           |
| UT-C-002 | 命令集管理       | 测试DomainCommandSet的管理    | 命令集成功创建和管理   | 否           |
| UT-C-003 | 命令注册冲突     | 测试命令名冲突处理            | 冲突被检测并按预期处理 | 否           |
| UT-C-004 | 序列化与反序列化 | 测试注册表序列化能力          | 注册表成功序列化和恢复 | 否           |
| UT-C-005 | 命令映射查询     | 测试从注册表查询命令          | 正确查询到注册的命令   | 否           |

## 2. 命令加载器测试

| 测试ID   | 测试名称     | 测试意图             | 预期结果             | 是否需要Mock           |
| -------- | ------------ | -------------------- | -------------------- | ---------------------- |
| UT-L-001 | 映射文件加载 | 测试加载领域映射文件 | 成功加载并解析映射   | 是，文件系统           |
| UT-L-002 | 扫描包操作   | 测试扫描可用包       | 成功识别和扫描DPML包 | 是，文件系统和npm包    |
| UT-L-003 | 领域命令加载 | 测试加载特定领域命令 | 成功加载指定领域命令 | 是，文件系统和动态导入 |
| UT-L-004 | 配置验证     | 测试命令配置验证     | 正确验证配置合法性   | 否                     |
| UT-L-005 | 刷新映射操作 | 测试映射刷新功能     | 映射成功更新         | 是，文件系统           |
| UT-L-006 | 动态导入配置 | 测试动态导入命令配置 | 成功导入并解析配置   | 是，动态导入           |
| UT-L-007 | 包查找功能   | 测试查找DPML相关包   | 成功找到所有相关包   | 是，文件系统           |

## 3. 配置管理测试

| 测试ID    | 测试名称   | 测试意图            | 预期结果             | 是否需要Mock |
| --------- | ---------- | ------------------- | -------------------- | ------------ |
| UT-CF-001 | 配置加载   | 测试配置加载功能    | 成功加载配置文件     | 是，文件系统 |
| UT-CF-002 | 配置保存   | 测试配置保存功能    | 成功保存配置到文件   | 是，文件系统 |
| UT-CF-003 | 配置项访问 | 测试获取/设置配置项 | 正确获取和设置配置项 | 否           |
| UT-CF-004 | 目录创建   | 测试配置目录创建    | 成功创建不存在的目录 | 是，文件系统 |
| UT-CF-005 | 配置默认值 | 测试配置默认值      | 缺失配置时使用默认值 | 否           |
| UT-CF-006 | 路径解析   | 测试配置路径解析    | 正确解析各种路径     | 是，操作系统 |
| UT-CF-007 | 错误处理   | 测试配置错误处理    | 正确处理文件操作错误 | 是，文件系统 |

## 4. 命令执行器测试

| 测试ID   | 测试名称     | 测试意图             | 预期结果               | 是否需要Mock    |
| -------- | ------------ | -------------------- | ---------------------- | --------------- |
| UT-E-001 | 命令结构构建 | 测试命令结构构建     | 成功构建Commander结构  | 是，Commander   |
| UT-E-002 | 命令执行     | 测试命令执行流程     | 成功执行命令并获取结果 | 是，Command实现 |
| UT-E-003 | 参数解析     | 测试命令行参数解析   | 正确解析各种参数       | 是，Commander   |
| UT-E-004 | 错误处理     | 测试命令执行错误处理 | 正确处理执行错误       | 否              |
| UT-E-005 | 上下文设置   | 测试执行上下文管理   | 上下文被正确设置和使用 | 否              |
| UT-E-006 | 命令帮助生成 | 测试帮助文档生成     | 正确生成命令帮助       | 是，Commander   |
| UT-E-007 | 命令别名支持 | 测试命令别名功能     | 命令别名被正确识别     | 是，Commander   |

## 5. CLI核心测试

| 测试ID     | 测试名称  | 测试意图          | 预期结果           | 是否需要Mock |
| ---------- | --------- | ----------------- | ------------------ | ------------ |
| UT-CLI-001 | CLI初始化 | 测试CLI初始化流程 | 成功初始化各组件   | 是，各组件   |
| UT-CLI-002 | 运行流程  | 测试CLI运行主流程 | CLI成功执行命令    | 是，各组件   |
| UT-CLI-003 | 更新检测  | 测试映射更新检测  | 正确检测更新需求   | 是，命令参数 |
| UT-CLI-004 | 错误捕获  | 测试全局错误捕获  | 成功捕获并处理错误 | 是，人为错误 |
| UT-CLI-005 | 组件协作  | 测试各组件协作    | 组件之间协作正常   | 是，各组件   |

## 6. 路径工具测试

| 测试ID   | 测试名称     | 测试意图             | 预期结果           | 是否需要Mock |
| -------- | ------------ | -------------------- | ------------------ | ------------ |
| UT-P-001 | 主目录获取   | 测试获取用户主目录   | 返回正确的主目录   | 是，操作系统 |
| UT-P-002 | 配置目录获取 | 测试获取DPML配置目录 | 返回正确的配置目录 | 是，操作系统 |
| UT-P-003 | 映射文件路径 | 测试获取映射文件路径 | 返回正确的文件路径 | 是，操作系统 |
| UT-P-004 | 配置文件路径 | 测试获取配置文件路径 | 返回正确的文件路径 | 是，操作系统 |
| UT-P-005 | 目录确保     | 测试确保目录存在     | 成功创建或确认目录 | 是，文件系统 |
| UT-P-006 | Node模块查找 | 测试查找node_modules | 成功找到模块目录   | 是，文件系统 |
| UT-P-007 | 路径存在检查 | 测试检查路径是否存在 | 正确报告路径存在性 | 是，文件系统 |
| UT-P-008 | 相对路径解析 | 测试解析相对路径     | 成功转换为绝对路径 | 是，操作系统 |

## 7. 日志工具测试

| 测试ID     | 测试名称     | 测试意图             | 预期结果                   | 是否需要Mock |
| ---------- | ------------ | -------------------- | -------------------------- | ------------ |
| UT-LOG-001 | 日志级别设置 | 测试设置日志级别     | 日志级别被正确设置         | 否           |
| UT-LOG-002 | 日志输出控制 | 测试根据级别控制输出 | 根据级别正确输出或抑制日志 | 是，控制台   |
| UT-LOG-003 | 格式化能力   | 测试日志格式化       | 日志被正确格式化           | 否           |
| UT-LOG-004 | 颜色输出     | 测试彩色输出         | 正确应用彩色输出           | 是，chalk    |
| UT-LOG-005 | 时间戳功能   | 测试时间戳添加       | 正确添加时间戳             | 是，日期对象 |
| UT-LOG-006 | 帮助格式化   | 测试帮助信息格式化   | 正确格式化帮助信息         | 是，控制台   |

## 8. 错误处理测试

| 测试ID     | 测试名称       | 测试意图             | 预期结果               | 是否需要Mock  |
| ---------- | -------------- | -------------------- | ---------------------- | ------------- |
| UT-ERR-001 | 命令不存在错误 | 测试命令不存在情况   | 提供友好错误信息       | 否            |
| UT-ERR-002 | 领域不存在错误 | 测试领域不存在情况   | 提供友好错误信息       | 否            |
| UT-ERR-003 | 配置文件错误   | 测试配置文件错误情况 | 提供明确错误信息       | 是，文件系统  |
| UT-ERR-004 | 动态导入错误   | 测试动态导入失败情况 | 提供有用错误信息       | 是，动态导入  |
| UT-ERR-005 | 参数错误       | 测试无效参数情况     | 提供参数使用说明       | 是，Commander |
| UT-ERR-006 | 执行错误       | 测试命令执行错误     | 正确捕获并显示错误     | 是，命令实现  |
| UT-ERR-007 | 详细模式错误   | 测试详细模式错误信息 | 在详细模式提供更多信息 | 否            |

## 9. 集成测试

| 测试ID     | 测试名称       | 测试意图             | 预期结果               | 是否需要Mock     |
| ---------- | -------------- | -------------------- | ---------------------- | ---------------- |
| IT-CLI-001 | 端到端基本流程 | 测试完整CLI执行流程  | 成功运行并执行命令     | 是，部分组件     |
| IT-CLI-002 | 实际命令加载   | 测试加载真实命令     | 成功加载和执行真实命令 | 是，部分文件系统 |
| IT-CLI-003 | 帮助命令       | 测试帮助命令功能     | 成功显示帮助信息       | 是，控制台       |
| IT-CLI-004 | 版本命令       | 测试版本命令功能     | 成功显示版本信息       | 是，控制台       |
| IT-CLI-005 | 更新映射流程   | 测试完整更新映射流程 | 成功更新命令映射       | 是，文件系统     |
| IT-CLI-006 | 错误处理流程   | 测试完整错误处理流程 | 错误被正确处理和显示   | 是，部分组件     |

## 10. 性能测试

| 测试ID     | 测试名称     | 测试意图         | 预期结果               | 是否需要Mock |
| ---------- | ------------ | ---------------- | ---------------------- | ------------ |
| PT-CLI-001 | 命令加载性能 | 测试命令加载性能 | 加载时间在可接受范围内 | 是，大量命令 |
| PT-CLI-002 | 启动时间     | 测试CLI启动时间  | 启动时间在可接受范围内 | 是，部分组件 |
| PT-CLI-003 | 内存占用     | 测试内存占用情况 | 内存使用在合理范围内   | 是，大量命令 |
| PT-CLI-004 | 资源释放     | 测试资源正确释放 | 没有资源泄漏           | 是，部分组件 |

## 11. 用户体验测试

| 测试ID     | 测试名称       | 测试意图               | 预期结果         | 是否需要Mock  |
| ---------- | -------------- | ---------------------- | ---------------- | ------------- |
| UX-CLI-001 | 命令进度显示   | 测试长时间命令进度显示 | 正确显示进度指示 | 是，ora       |
| UX-CLI-002 | 错误信息友好性 | 测试错误信息可理解性   | 错误信息清晰友好 | 否            |
| UX-CLI-003 | 交互式提示     | 测试交互式提示功能     | 交互提示正常工作 | 是，inquirer  |
| UX-CLI-004 | 彩色输出一致性 | 测试彩色输出一致性     | 彩色输出风格统一 | 是，chalk     |
| UX-CLI-005 | 帮助文档清晰度 | 测试帮助文档清晰度     | 帮助文档清晰易懂 | 是，Commander |

## 12. 第三方集成测试

| 测试ID      | 测试名称      | 测试意图              | 预期结果              | 是否需要Mock |
| ----------- | ------------- | --------------------- | --------------------- | ------------ |
| EXT-CLI-001 | Commander集成 | 测试与Commander库集成 | 成功集成Commander功能 | 否           |
| EXT-CLI-002 | Inquirer集成  | 测试与Inquirer库集成  | 成功集成Inquirer功能  | 是，用户输入 |
| EXT-CLI-003 | Chalk集成     | 测试与Chalk库集成     | 成功集成Chalk功能     | 是，控制台   |
| EXT-CLI-004 | Ora集成       | 测试与Ora库集成       | 成功集成Ora功能       | 是，控制台   |
| EXT-CLI-005 | Boxen集成     | 测试与Boxen库集成     | 成功集成Boxen功能     | 是，控制台   |

## 13. 实际领域命令测试

| 测试ID     | 测试名称         | 测试意图             | 预期结果                   | 是否需要Mock       |
| ---------- | ---------------- | -------------------- | -------------------------- | ------------------ |
| DC-CLI-001 | Prompt领域命令   | 测试prompt领域命令   | 成功加载和执行prompt命令   | 是，@dpml/prompt   |
| DC-CLI-002 | Agent领域命令    | 测试agent领域命令    | 成功加载和执行agent命令    | 是，@dpml/agent    |
| DC-CLI-003 | Workflow领域命令 | 测试workflow领域命令 | 成功加载和执行workflow命令 | 是，@dpml/workflow |
| DC-CLI-004 | 默认命令处理     | 测试默认命令处理     | 成功使用默认命令           | 是，领域包         |
| DC-CLI-005 | 参数处理规则     | 测试参数处理规则     | 正确处理命令和参数         | 是，领域包         |

## 14. 兼容性测试

| 测试ID     | 测试名称           | 测试意图                  | 预期结果                      | 是否需要Mock    |
| ---------- | ------------------ | ------------------------- | ----------------------------- | --------------- |
| CT-CLI-001 | Node.js版本兼容性  | 测试不同Node.js版本兼容性 | 在支持的Node.js版本上正常工作 | 否              |
| CT-CLI-002 | 不同操作系统兼容性 | 测试跨操作系统兼容性      | 在主要操作系统上正常工作      | 是，操作系统API |
| CT-CLI-003 | 领域包版本兼容性   | 测试不同领域包版本兼容性  | 与领域包版本兼容              | 是，领域包      |
