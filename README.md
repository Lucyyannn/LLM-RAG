**"智能旅游助手“——基于国产llm的RAG及Agent开发的智能体设计**

<img style="float:left!important; width=200;" alt="image" src="https://github.com/user-attachments/assets/6d7ba1c6-65fc-40ef-87af-2af01f4dc50d" />

## 功能：
- 全国任意地区的旅游咨询、建议、规划，精确到景点、门票、天气等；
- 附加功能：根据用户的潜在目的地，自动展示当地风景图片、一周天气预报；
- 支持多种语言、多种主题背景；支持语音播放、提示问题等功能
## 核心技术：
- 基于百川大模型，使用LangChain搭建工作流，RAG实现旅游信息服务；
- 使用FastAPI搭建Web服务；
- 双链并行，识别用户潜在目的地；精细化prompt实现聊天内容到规范地名的精准映射；
- 数据抓取和处理，实现中央气象台官网实时数据的格式化展示；
- ......
