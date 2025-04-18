# DPML Transformer 测试用例

本文档描述了Transformer模块的单元测试和集成测试用例，旨在保证Transformer的功能正确性和稳定性。Transformer作为DPML处理流程中的最终转换层，负责将处理后的文档转换为特定目标格式。

## 1. 核心功能单元测试

### 1.1 Transformer基础功能

| 测试ID   | 测试名称         | 测试意图                         | 预期结果                             |
| -------- | ---------------- | -------------------------------- | ------------------------------------ |
| UT-T-001 | 基本转换测试     | 测试转换器能否处理基本文档结构   | 返回符合预期的输出格式               |
| UT-T-002 | 访问者注册与排序 | 测试访问者注册和优先级排序机制   | 访问者按优先级从高到低排序执行       |
| UT-T-003 | 输出适配器设置   | 测试输出适配器的设置和替换       | 适配器被正确设置并用于最终输出       |
| UT-T-004 | 转换选项配置     | 测试转换选项对转换过程的影响     | 选项正确影响转换行为和结果           |
| UT-T-005 | 节点处理顺序     | 测试转换过程中的节点处理顺序     | 文档节点按预期顺序处理               |
| UT-T-006 | 转换上下文创建   | 测试转换上下文的创建和传递       | 上下文在整个转换过程中保持一致和更新 |
| UT-T-007 | 父结果传递       | 测试父节点结果传递给子节点的机制 | 父结果正确传递到子节点转换过程       |
| UT-T-008 | 路径构建         | 测试当前路径的构建和传递         | 路径正确反映当前处理位置             |

### 1.2 访问者测试

#### 1.2.1 DocumentVisitor

| 测试ID    | 测试名称         | 测试意图                           | 预期结果                         |
| --------- | ---------------- | ---------------------------------- | -------------------------------- |
| UT-DV-001 | 基本文档结构处理 | 测试文档结构访问者的基本功能       | 创建预期的文档级结构             |
| UT-DV-002 | 文档元数据处理   | 测试文档元数据的收集和转换         | 文档元数据被正确包含在输出中     |
| UT-DV-003 | 子节点处理委托   | 测试子节点处理的委托机制           | 子节点被正确委托给其他访问者处理 |
| UT-DV-004 | 优先级覆盖测试   | 测试高优先级文档访问者覆盖低优先级 | 高优先级访问者处理结果优先       |

#### 1.2.2 ElementVisitor

| 测试ID    | 测试名称         | 测试意图                   | 预期结果                       |
| --------- | ---------------- | -------------------------- | ------------------------------ |
| UT-EV-001 | 基本元素转换     | 测试元素访问者基本功能     | 元素被正确转换为期望结构       |
| UT-EV-002 | 不同类型元素处理 | 测试不同类型标签的处理     | 各类型标签按期望方式转换       |
| UT-EV-003 | 元素属性处理     | 测试元素属性的收集和转换   | 属性被正确包含在输出中         |
| UT-EV-004 | 元素元数据处理   | 测试元素元数据的收集和转换 | 元素元数据被正确包含在输出中   |
| UT-EV-005 | 嵌套元素处理     | 测试嵌套元素的处理         | 正确处理嵌套结构，保持层次关系 |
| UT-EV-006 | 未知元素处理     | 测试未注册处理器的元素处理 | 根据模式适当处理或忽略         |

#### 1.2.3 ContentVisitor

| 测试ID    | 测试名称     | 测试意图               | 预期结果                     |
| --------- | ------------ | ---------------------- | ---------------------------- |
| UT-CV-001 | 基本内容转换 | 测试内容访问者基本功能 | 内容被正确转换为期望格式     |
| UT-CV-002 | Markdown转换 | 测试Markdown内容的处理 | Markdown被正确处理为目标格式 |
| UT-CV-003 | 纯文本处理   | 测试纯文本内容的处理   | 纯文本按预期格式处理         |
| UT-CV-004 | 特殊字符处理 | 测试包含特殊字符的内容 | 特殊字符被正确处理或转义     |

#### 1.2.4 ReferenceVisitor

| 测试ID    | 测试名称         | 测试意图               | 预期结果                   |
| --------- | ---------------- | ---------------------- | -------------------------- |
| UT-RV-001 | 基本引用转换     | 测试引用访问者基本功能 | 引用被正确转换为预期结构   |
| UT-RV-002 | 已解析引用处理   | 测试已解析引用的处理   | 解析结果被正确包含在输出中 |
| UT-RV-003 | 不同类型引用处理 | 测试不同协议引用的处理 | 各类型引用按预期转换       |
| UT-RV-004 | 引用内容格式化   | 测试引用内容的格式化   | 内容按目标格式正确处理     |

### 1.3 标签处理器测试

| 测试ID    | 测试名称       | 测试意图                     | 预期结果                         |
| --------- | -------------- | ---------------------------- | -------------------------------- |
| UT-TP-001 | 基本标签处理   | 测试标签处理器的基本功能     | 标签被正确处理为目标格式         |
| UT-TP-002 | 条件处理测试   | 测试canProcess方法的条件判断 | 只处理符合条件的标签             |
| UT-TP-003 | 处理器注册机制 | 测试处理器的注册和获取       | 处理器被正确注册和获取           |
| UT-TP-004 | 多处理器联动   | 测试多个处理器处理同一标签   | 按注册顺序处理，结果传递         |
| UT-TP-005 | 标签处理上下文 | 测试标签处理上下文传递       | 上下文在处理过程中正确传递和更新 |

### 1.4 输出适配器测试

| 测试ID    | 测试名称       | 测试意图               | 预期结果                           |
| --------- | -------------- | ---------------------- | ---------------------------------- |
| UT-OA-001 | JSON适配器     | 测试JSON输出适配器     | 输出符合预期的JSON结构             |
| UT-OA-002 | 字符串适配器   | 测试字符串输出适配器   | 输出符合预期的字符串格式           |
| UT-OA-003 | 通用结构适配器 | 测试通用结构输出适配器 | 输出符合预期的通用结构             |
| UT-OA-004 | 适配器工厂     | 测试适配器工厂机制     | 根据格式名称创建正确的适配器       |
| UT-OA-005 | 适配器链       | 测试多适配器链式处理   | 按顺序应用多个适配器，结果符合预期 |

## 2. 扩展机制测试

### 2.1 访问者扩展测试

| 测试ID    | 测试名称         | 测试意图                     | 预期结果                         |
| --------- | ---------------- | ---------------------------- | -------------------------------- |
| UT-VE-001 | 自定义访问者注册 | 测试自定义访问者的注册和使用 | 自定义访问者被正确注册并执行     |
| UT-VE-002 | 访问者优先级机制 | 测试访问者优先级影响执行顺序 | 按优先级从高到低执行             |
| UT-VE-003 | 访问者协作处理   | 测试多个访问者的协作处理     | 各访问者正确协作完成转换         |
| UT-VE-004 | 访问者错误处理   | 测试访问者出错时的处理机制   | 错误被适当处理，不影响其他访问者 |

### 2.2 输出适配器扩展测试

| 测试ID    | 测试名称         | 测试意图                     | 预期结果                     |
| --------- | ---------------- | ---------------------------- | ---------------------------- |
| UT-AE-001 | 自定义适配器注册 | 测试自定义适配器的注册和使用 | 自定义适配器被正确注册并使用 |
| UT-AE-002 | 适配器链注册     | 测试适配器链的注册和使用     | 适配器链被正确应用           |
| UT-AE-003 | 适配器工厂扩展   | 测试适配器工厂的扩展机制     | 工厂能正确创建自定义适配器   |

### 2.3 标签处理器扩展测试

| 测试ID    | 测试名称         | 测试意图                         | 预期结果                         |
| --------- | ---------------- | -------------------------------- | -------------------------------- |
| UT-PE-001 | 自定义标签处理器 | 测试自定义标签处理器的注册和使用 | 自定义处理器被正确注册并处理标签 |
| UT-PE-002 | 处理器条件判断   | 测试自定义处理条件的实现         | 条件判断正确决定是否处理标签     |
| UT-PE-003 | 处理器链扩展     | 测试处理器链的扩展机制           | 处理器链被正确扩展和执行         |

## 3. 集成测试

| 测试ID   | 测试名称        | 测试意图                         | 预期结果                           |
| -------- | --------------- | -------------------------------- | ---------------------------------- |
| IT-T-001 | 基本转换流程    | 测试完整的转换流程               | 文档被正确转换为目标格式           |
| IT-T-002 | 与Processor集成 | 测试Transformer与Processor的集成 | Processor输出被Transformer正确转换 |
| IT-T-003 | 复杂文档转换    | 测试复杂文档结构的转换           | 复杂结构被正确转换，保持语义       |
| IT-T-004 | 多格式输出      | 测试同一文档转换为多种格式       | 各格式输出符合各自预期             |
| IT-T-005 | 端到端测试      | 测试从解析到转换的完整流程       | 完整流程正常工作，输出符合预期     |

## 4. 错误处理测试

| 测试ID   | 测试名称       | 测试意图                   | 预期结果                       |
| -------- | -------------- | -------------------------- | ------------------------------ |
| ET-T-001 | 处理不完整AST  | 测试处理不完整或错误的AST  | 提供明确的错误信息             |
| ET-T-002 | 严格模式错误   | 测试严格模式下的错误处理   | 在严格模式下中断转换并报错     |
| ET-T-003 | 宽松模式错误   | 测试宽松模式下的错误处理   | 在宽松模式下记录错误但继续处理 |
| ET-T-004 | 访问者错误处理 | 测试访问者抛出异常的处理   | 异常被捕获，给出明确错误信息   |
| ET-T-005 | 未知格式处理   | 测试请求未知输出格式的处理 | 给出明确的不支持格式的错误     |

## 5. 性能和边界测试

| 测试ID   | 测试名称     | 测试意图                           | 预期结果                           |
| -------- | ------------ | ---------------------------------- | ---------------------------------- |
| PT-T-001 | 大文档转换   | 测试转换大型文档的性能             | 在合理时间内完成转换，无内存溢出   |
| PT-T-002 | 深度嵌套转换 | 测试转换深度嵌套结构的性能         | 正确处理深度嵌套，无栈溢出         |
| PT-T-003 | 复杂混合文档 | 测试转换包含多种元素类型的复杂文档 | 正确处理所有元素类型，输出符合预期 |
| PT-T-004 | 内存使用监控 | 测试转换过程中的内存使用           | 内存使用在合理范围内               |
| PT-T-005 | 并发转换测试 | 测试并发转换多个文档               | 并发转换正常工作，无竞态条件       |

## 6. 特殊场景测试

| 测试ID   | 测试名称       | 测试意图                         | 预期结果                   |
| -------- | -------------- | -------------------------------- | -------------------------- |
| ST-T-001 | 空文档转换     | 测试转换空文档或只有根节点的文档 | 生成有效的最小输出，不报错 |
| ST-T-002 | 特殊字符处理   | 测试包含特殊字符和转义字符的转换 | 特殊字符被正确处理         |
| ST-T-003 | 混合格式内容   | 测试包含多种格式标记的内容       | 混合格式被正确处理         |
| ST-T-004 | 非常规标签嵌套 | 测试非常规嵌套标签的处理         | 正确处理非常规嵌套         |
| ST-T-005 | 自定义变量替换 | 测试转换中的变量替换功能         | 变量被正确替换为实际值     |
