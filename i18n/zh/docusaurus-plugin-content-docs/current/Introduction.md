---
sidebar_position: 1
slug: /
hide_title: true
sidebar_label: Tier0 是什么?
---

## 什么是 Tier0？

Tier0 是一个基于统一命名空间（UNS）的工业数据平台。

它通过 Node-RED 连接数据，将其组织为统一结构，并提供给上层应用和业务分析使用。

---

## 它如何工作？

Tier0 在一个统一的流程中对数据建模，处理数据：

- Node-RED 从设备和系统中连接并处理数据  
- 数据被发布到统一命名空间（UNS），并在 Tier0 数据库中结构化存储  
- 数据被仪表板、应用程序和分析工具消费  

<img width={550} src="http://communityimage2.oss-cn-hangzhou.aliyuncs.com/191-1.png" />

---

## 核心组件

### 统一命名空间（UNS）
为所有工业数据定义分层结构。

`factory/workshopA/line1/cnc01/telemetry/spindleSpeed`


<img width={650} src="http://communityimage2.oss-cn-hangzhou.aliyuncs.com/192-1.png" />

### Node-RED 集成
用于数据连接与处理的核心引擎。

- 连接设备、应用和系统  
- 将数据格式化并发布到命名空间中  

<img width={450} src="http://communityimage2.oss-cn-hangzhou.aliyuncs.com/193.png" />

---

### Grafana 仪表板
实时可视化工业数据。

- 构建用于监控和分析洞察的仪表看板  
- 可直连平台数据  
- 支持多种数据可视化与分析  

<img width={550} src="http://communityimage2.oss-cn-hangzhou.aliyuncs.com/194.png" />

---

### Python Notebook
使用 Python 在交互式 Notebook 中灵活分析数据。

<img width={550} src="http://communityimage2.oss-cn-hangzhou.aliyuncs.com/195.png" />

---

### Agentic 应用构建器
使用自然语言在云端创建工业应用，无需消耗任何本地资源。应用创建完成可打包本地安装使用。

<img width={450} src="http://enterpriseimage.oss-cn-hangzhou.aliyuncs.com/4.png" />

---