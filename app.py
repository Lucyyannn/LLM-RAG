import json
from typing import List
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import bs4
import re
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from fastapi.staticfiles import StaticFiles
from langchain_core.prompts import ChatPromptTemplate
from langserve import add_routes
from dotenv import load_dotenv, find_dotenv
import os
from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_chroma import Chroma
from langchain.chains import create_history_aware_retriever
from langchain_core.documents import Document
from langchain_community.embeddings import BaichuanTextEmbeddings
import requests
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.output_parsers import StrOutputParser

#所有信息存储在all_documents中
############### 旅游信息 ################
all_documents = []
additional_documents = [
    Document(
        page_content="古文化街每天 09:00 - 17:00，免费（购物和小吃额外花费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="意大利风情区全天开放，免费（餐饮和购物额外花费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津海河夜景夜间开放，免费（游船费用约100元）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="五大道全天开放，免费（骑行和餐饮额外花费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="南市食品街每天 08:00 - 22:00，人均花费50元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津博物馆周二至周日 09:00 - 16:30（周一闭馆），免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="盘山每天 08:00 - 17:00，人均花费100元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="水上公园每天 06:30 - 21:00，免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="黄崖关长城每天 08:00 - 17:00，人均花费65元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津南开大学全天开放，免费（参观）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津中山公园每天 06:00 - 21:00，免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津市动物园每天 08:30 - 18:00，人均花费40元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津欢乐谷每天 10:00 -22:00，人均花费220元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津杨柳青古镇每天 08:00 - 18:00，免费（部分景点收费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津瓷房子每天 09:00 - 19:00，人均花费50元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津水滴体育场根据活动时间开放，人均花费根据活动不同（参观免费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津周邓纪念馆每天 09:00 - 16:00（周一闭馆），免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津望海楼教堂每天 05:00 - 16:00，免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津大悲院每天 09:00 - 16:00，人均花费10元。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津平津战役纪念馆每天 09:00 - 16:30（周一闭馆），免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津人民公园每天 07:00 - 22:00，免费。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津音乐厅根据演出时间开放，人均花费根据演出不同。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津滨江道商业街全天开放，免费（购物和餐饮额外花费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
    Document(
        page_content="天津津湾广场全天开放，免费（餐饮和娱乐额外花费）。",
        metadata={"source": "天津-旅游信息-doc"},
    ),
]


# 北京景区信息
beijing_documents = [
    Document(
        page_content="故宫博物院每天 08:30 - 17:00（周一闭馆），人均花费60元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="天坛公园每天 06:00 - 22:00，人均花费15元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="颐和园每天 06:30 - 20:00，人均花费30元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="八达岭长城每天 07:30 - 18:00，人均花费40元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="鸟巢（国家体育场）每天 10:00 - 18:00，人均花费50元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="水立方（国家游泳中心）每天 10:30 - 21:30，人均花费30元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="北京动物园每天 07:30 - 19:00，人均花费20元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="北海公园每天 06:30 - 20:00，人均花费10元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="雍和宫每天 09:00 - 17:00，人均花费25元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="圆明园每天 07:00 - 19:00，人均花费10元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="景山公园每天 06:00 - 21:00，人均花费2元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="中国国家博物馆每天 09:00 - 17:30（周一闭馆），免费。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="北京欢乐谷每天 09:00 - 22:00，人均花费260元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="北京植物园每天 06:30 - 20:00，人均花费10元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="北京天文馆每天 09:00 - 16:30（周一闭馆），人均花费10元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="香山公园每天 06:00 - 19:30，人均花费10元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="恭王府每天 08:00 - 17:00，人均花费40元。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="北京前门大街全天开放，免费（购物和餐饮额外花费）。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="南锣鼓巷全天开放，免费（购物和餐饮额外花费）。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
    Document(
        page_content="798艺术区全天开放，免费（展览和餐饮额外花费）。",
        metadata={"source": "北京-旅游信息-doc"},
    ),
]

all_documents.extend(additional_documents)
all_documents.extend(beijing_documents)
############## 天气信息 #################
bs4_strainer = bs4.SoupStrainer(class_="7days day7 pull-right clearfix")
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500, chunk_overlap=100, add_start_index=True
)

"""
加载+拆分
"""
def load_and_split(url):
    loader = WebBaseLoader(
        web_paths=(url,),
        bs_kwargs={"parse_only": bs4_strainer},
    )
    docs = loader.load()
    return text_splitter.split_documents(docs)


import pinyin 
province_dict = {
    "ATJ": ["天津"],
    "ABJ": ["北京"],
    "ASH": ["上海"],
    "ACQ": ["重庆"],
    "AXG": ["香港"],
    "AAM": ["澳门"],
    "ATW": [
        "台北", "新北", "桃园", "台中", "台南", "高雄", "基隆", "新竹", "嘉义",
        "苗栗", "彰化", "南投", "云林", "屏东", "宜兰", "花莲", "台东", "澎湖", "金门", "连江"
    ],
    "AHE": ["石家庄", "唐山", "秦皇岛", "邯郸", "邢台", "保定", "张家口", "承德", "沧州", "廊坊", "衡水"],
    "ASX": ["太原", "大同", "阳泉", "长治", "晋城", "朔州", "晋中", "运城", "忻州", "临汾", "吕梁"],
    "ALN": ["沈阳", "大连", "鞍山", "抚顺", "本溪", "丹东", "锦州", "营口", "阜新", "辽阳", "盘锦", "铁岭", "朝阳", "葫芦岛"],
    "AJN": ["长春", "吉林", "四平", "辽源", "通化", "白山", "松原", "白城", "延边"],
    "AHL": ["哈尔滨", "齐齐哈尔", "鸡西", "鹤岗", "双鸭山", "大庆", "伊春", "佳木斯", "七台河", "牡丹江", "黑河", "绥化", "大兴安岭"],
    "AJS": ["南京", "无锡", "徐州", "常州", "苏州", "南通", "连云港", "淮安", "盐城", "扬州", "镇江", "泰州", "宿迁"],
    "AZJ": ["杭州", "宁波", "温州", "嘉兴", "湖州", "绍兴", "金华", "衢州", "舟山", "台州", "丽水"],
    "AAH": ["合肥", "芜湖", "蚌埠", "淮南", "马鞍山", "淮北", "铜陵", "安庆", "黄山", "滁州", "阜阳", "宿州", "六安", "亳州", "池州", "宣城"],
    "AFJ": ["福州", "厦门", "莆田", "三明", "泉州", "漳州", "南平", "龙岩", "宁德"],
    "AJX": ["南昌", "景德镇", "萍乡", "九江", "新余", "鹰潭", "赣州", "吉安", "宜春", "抚州", "上饶"],
    "ASD": ["济南", "青岛", "淄博", "枣庄", "东营", "烟台", "潍坊", "济宁", "泰安", "威海", "日照", "临沂", "德州", "聊城", "滨州", "菏泽"],
    "AHA": ["郑州", "开封", "洛阳", "平顶山", "安阳", "鹤壁", "新乡", "焦作", "濮阳", "许昌", "漯河", "三门峡", "南阳", "商丘", "信阳", "周口", "驻马店", "济源"],
    "AHB": ["武汉", "黄石", "十堰", "宜昌", "襄阳", "鄂州", "荆门", "孝感", "荆州", "黄冈", "咸宁", "随州", "恩施", "仙桃", "潜江", "天门", "神农架"],
    "AHN": ["长沙", "株洲", "湘潭", "衡阳", "邵阳", "岳阳", "常德", "张家界", "益阳", "郴州", "永州", "怀化", "娄底", "湘西"],
    "AGD": ["广州", "韶关", "深圳", "珠海", "汕头", "佛山", "江门", "湛江", "茂名", "肇庆", "惠州", "梅州", "汕尾", "河源", "阳江", "清远", "东莞", "中山", "潮州", "揭阳", "云浮"],
    "AHI": ["海口", "三亚", "三沙", "儋州"],
    "ASC": ["成都", "自贡", "攀枝花", "泸州", "德阳", "绵阳", "广元", "遂宁", "内江", "乐山", "南充", "眉山", "宜宾", "广安", "达州", "雅安", "巴中", "资阳", "阿坝", "甘孜", "凉山"],
    "AGZ": ["贵阳", "六盘水", "遵义", "安顺", "毕节", "铜仁", "黔西南", "黔东南", "黔南"],
    "AYN": ["昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧", "楚雄", "红河", "文山", "西双版纳", "大理", "德宏", "怒江", "迪庆"],
    "ASN": ["西安", "铜川", "宝鸡", "咸阳", "渭南", "延安", "汉中", "榆林", "安康", "商洛"],
    "AGS": ["兰州", "嘉峪关", "金昌", "白银", "天水", "武威", "张掖", "平凉", "酒泉", "庆阳", "定西", "陇南", "临夏", "甘南"],
    "AQH": ["西宁", "海东", "海北", "黄南", "海南", "果洛", "玉树", "海西"],
    "ANM": ["呼和浩特", "包头", "乌海", "赤峰", "通辽", "鄂尔多斯", "呼伦贝尔", "巴彦淖尔", "乌兰察布", "兴安盟", "锡林郭勒盟", "阿拉善盟"],
    "AGX": ["南宁", "柳州", "桂林", "梧州", "北海", "防城港", "钦州", "贵港", "玉林", "百色", "贺州", "河池", "来宾", "崇左"],
    "AXZ": ["拉萨", "日喀则", "昌都", "林芝", "山南", "那曲", "阿里"],
    "ANX": ["银川", "石嘴山", "吴忠", "固原", "中卫"],
    "AXJ": ["乌鲁木齐", "克拉玛依", "吐鲁番", "哈密", "昌吉", "博尔塔拉", "巴音郭楞", "阿克苏", "克孜勒苏柯尔克孜", "喀什", "和田", "伊犁哈萨克", "塔城", "阿勒泰", "石河子", "阿拉尔", "图木舒克", "五家渠", "铁门关"]
}
BAICHUAN_API_KEY="sk-2d7d4c50961b732b34f0652ef30c7443"
##########################################
# Load environment variables
_ = load_dotenv(find_dotenv())

# 1. Create prompt template
system_template = ("你是一个智能旅游助手，你的回复必须围绕旅游进行回复:""\n\n""{context}")

os.environ["BAICHUAN_API_KEY"] = os.getenv("BAICHUAN_API_KEY")
print(os.getenv("BAICHUAN_API_KEY"))
# 3. Create model
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    base_url="http://api.baichuan-ai.com/v1",
    api_key=BAICHUAN_API_KEY,
    model="Baichuan4",
)

store = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


qa_prompt = ChatPromptTemplate.from_messages([
    ("system", system_template),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}")
])

from langchain_community.embeddings import BaichuanTextEmbeddings

embeddings = BaichuanTextEmbeddings(baichuan_api_key=BAICHUAN_API_KEY)

vectorstore = Chroma.from_documents(documents=all_documents, embedding=embeddings)
retriever = vectorstore.as_retriever()

question_answer_chain = create_stuff_documents_chain(model, qa_prompt)

contextualize_q_system_prompt = (
    "根据聊天记录及用户最新的问题来回答"
    "该问题可能涉及聊天记录中的上下文信息"
    "如果涉及了必须加上，没有涉及则可以不加"
)

contextuallize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}")
])
history_aware_retriever = create_history_aware_retriever(model, retriever, contextuallize_q_prompt)

question_answer_chain = create_stuff_documents_chain(model, qa_prompt)
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer"
)

# 6. App definition
app = FastAPI(
    title="Intelligent Travel Assistant",
    description="A simple API server using LangChain's Runnable interface",
    version="0.0.1"
)

# 7. Adding chain route
add_routes(
    app,
    conversational_rag_chain,
    path="/chain",
)

# 8. Publishing static resources
app.mount("/pages", StaticFiles(directory="static"), name="pages")

# 9. CORS for cross-origin requests
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
)

#从某地区url提取天气信息
def fetch_weather_data(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    # 提取天气信息
    weather_info = []
    days = soup.find_all(class_='date')
    temp_pattern = re.compile(r'tmp tmp_lte_\w+')
    temperatures = soup.find_all(class_=temp_pattern)
    descriptions = soup.find_all(class_='desc')
    #整理列表
    ####################晚上生效###################
    if(len(temperatures)==13):
        new_element_html = "<div class='tmp tmp_lte_40'> </div>"
        new_element = BeautifulSoup(new_element_html, 'html.parser').div
        temperatures.insert(0, new_element)
    ####################晚上生效###################

    temperatures_l = [temperatures[i] for i in range(0, len(temperatures), 2)]
    temperatures_h = [temperatures[i] for i in range(1, len(temperatures), 2)]
    description_1 = [descriptions[i] for i in range(0, len(descriptions), 2)]
    description_2 = [descriptions[i] for i in range(1, len(descriptions), 2)]

    if len(days) == len(temperatures_l) == len(temperatures_h) == len(description_1) == len(description_2):
        for day, temp_l, temp_h, desc1, desc2 in zip(days, temperatures_l, temperatures_h, description_1, description_2):
            date = day.get_text(strip=True)
            temperature_l = temp_l.get_text(strip=True)
            temperature_h = temp_h.get_text(strip=True)
            description1 = desc1.get_text(strip=True)
            description2 = desc2.get_text(strip=True)
            if(description1==description2):
                weather_info.append(f"{date}: {temperature_l}~{temperature_h}, {description1}")
            else:
                weather_info.append(f"{date}: {temperature_l}~{temperature_h}, {description1}转{description2}")
    else:
        print("Error: Lists have different lengths.")

    return weather_info



#用于识别地区的新chain
#解析器
loc_parser=StrOutputParser()
#提示
loc_system_template="""分析用户消息的含义，推理出用户想去的地方所属的城市。
   如果这个地方低于市级，请回答它所在的城市（约定自治州属于市级）。如果这个地方是省份，请回答它的省会。如果是国家，就回复首都！
   不要回答用户不想去的地方。如果有多个想去的，只答第一个。
   输出要求：只用中文,只输出城市的名字！不要带类似市，自治州这样的行政级别后缀。不要输出多余的文字和符号。"""


prompt_template = ChatPromptTemplate.from_messages(
    [("system", loc_system_template), ("user", "{text}")]
)
loc_chain=prompt_template | model | loc_parser

#根据请求内容检索网址
@app.post("/weather")
async def get_weather(request: Request):
    data = await request.json()
    city_name = data.get("location", "北京")
    city_pinyin = pinyin.get(city_name, format="strip", delimiter="")
    flag=False

    for province_code, cities in province_dict.items():
        if city_name in cities:
            flag=True
            if city_name == "天津":
                city_pinyin = "wuqing"
            elif city_name == "重庆":
                city_pinyin = "wushan"
            elif city_name == "上海":
                city_pinyin = "baoshan"
            elif city_name == "澳门":
                city_pinyin ="datanshan"
            elif city_name == "香港":
                city_pinyin ="xianggangtianwentai"

            url = f"http://www.nmc.cn/publish/forecast/{province_code}/{city_pinyin}.html"
            break

    if flag==False:
       return JSONResponse({"error": "Location not found"}, status_code=404)
    
    weather_info = fetch_weather_data(url)
    return JSONResponse({"weather": weather_info})

locations = [
                "天津", "北京", "上海", "重庆", "澳门","香港",
                "台北", "新北", "桃园", "台中", "台南", "高雄", "基隆", "嘉义",
                "新竹", "苗栗", "彰化", "南投", "云林", "屏东", "宜兰", "花莲", "台东", "澎湖", "金门", "连江",
                "石家庄", "唐山", "秦皇岛", "邯郸", "邢台", "保定", "张家口", "承德", "沧州", "廊坊", "衡水",
                "太原", "大同", "阳泉", "长治", "晋城", "朔州", "晋中", "运城", "忻州", "临汾", "吕梁",
                "沈阳", "大连", "鞍山", "抚顺", "本溪", "丹东", "锦州", "营口", "阜新", "辽阳", "盘锦", "铁岭", "朝阳", "葫芦岛",
                "长春", "吉林", "四平", "辽源", "通化", "白山", "松原", "白城", "延边",
                "哈尔滨", "齐齐哈尔", "鸡西", "鹤岗", "双鸭山", "大庆", "伊春", "佳木斯", "七台河", "牡丹江", "黑河", "绥化", "大兴安岭",
                "南京", "无锡", "徐州", "常州", "苏州", "南通", "连云港", "淮安", "盐城", "扬州", "镇江", "泰州", "宿迁",
                "杭州", "宁波", "温州", "嘉兴", "湖州", "绍兴", "金华", "衢州", "舟山", "台州", "丽水",
                "合肥", "芜湖", "蚌埠", "淮南", "马鞍山", "淮北", "铜陵", "安庆", "黄山", "滁州", "阜阳", "宿州", "六安", "亳州", "池州", "宣城",
                "福州", "厦门", "莆田", "三明", "泉州", "漳州", "南平", "龙岩", "宁德",
                "南昌", "景德镇", "萍乡", "九江", "新余", "鹰潭", "赣州", "吉安", "宜春", "抚州", "上饶",
                "济南", "青岛", "淄博", "枣庄", "东营", "烟台", "潍坊", "济宁", "泰安", "威海", "日照", "临沂", "德州", "聊城", "滨州", "菏泽",
                "郑州", "开封", "洛阳", "平顶山", "安阳", "鹤壁", "新乡", "焦作", "濮阳", "许昌", "漯河", "三门峡", "南阳", "商丘", "信阳", "周口", "驻马店", "济源",
                "武汉", "黄石", "十堰", "宜昌", "襄阳", "鄂州", "荆门", "孝感", "荆州", "黄冈", "咸宁", "随州", "恩施", "仙桃", "潜江", "天门", "神农架",
                "长沙", "株洲", "湘潭", "衡阳", "邵阳", "岳阳", "常德", "张家界", "益阳", "郴州", "永州", "怀化", "娄底", "湘西",
                "广州", "韶关", "深圳", "珠海", "汕头", "佛山", "江门", "湛江", "茂名", "肇庆", "惠州", "梅州", "汕尾", "河源", "阳江", "清远", "东莞", "中山", "潮州", "揭阳", "云浮",
                "海口", "三亚", "三沙", "儋州",
                "成都", "自贡", "攀枝花", "泸州", "德阳", "绵阳", "广元", "遂宁", "内江", "乐山", "南充", "眉山", "宜宾", "广安", "达州", "雅安", "巴中", "资阳", "阿坝", "甘孜", "凉山",
                "贵阳", "六盘水", "遵义", "安顺", "毕节", "铜仁", "黔西南", "黔东南", "黔南",
                "昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧", "楚雄", "红河", "文山", "西双版纳", "大理", "德宏", "怒江", "迪庆",
                "西安", "铜川", "宝鸡", "咸阳", "渭南", "延安", "汉中", "榆林", "安康", "商洛",
                "兰州", "嘉峪关", "金昌", "白银", "天水", "武威", "张掖", "平凉", "酒泉", "庆阳", "定西", "陇南", "临夏", "甘南",
                "西宁", "海东", "海北", "黄南", "海南", "果洛", "玉树", "海西",
                "呼和浩特", "包头", "乌海", "赤峰", "通辽", "鄂尔多斯", "呼伦贝尔", "巴彦淖尔", "乌兰察布", "兴安盟", "锡林郭勒盟", "阿拉善盟",
                "南宁", "柳州", "桂林", "梧州", "北海", "防城港", "钦州", "贵港", "玉林", "百色", "贺州", "河池", "来宾", "崇左",
                "拉萨", "日喀则", "昌都", "林芝", "山南", "那曲", "阿里",
                "银川", "石嘴山", "吴忠", "固原", "中卫",
                "乌鲁木齐", "克拉玛依", "吐鲁番", "哈密", "昌吉", "博尔塔拉", "巴音郭楞", "阿克苏", "克孜勒苏柯尔克孜", "喀什", "和田", "伊犁哈萨克", "塔城", "阿勒泰", "石河子", "阿拉尔", "图木舒克", "五家渠", "铁门关"]

# Endpoint to process user message and check for region
@app.post("/process_message")
async def process_message(request: Request):
    data = await request.json()
    user_message = data['message']
    region = check_region_in_message(user_message)


    if region:
        return JSONResponse({"region": region, "response": "我们正在为您查询天气信息..."})
    else:
        return JSONResponse({"response": "对不起，我没有找到相关的地区信息。"})

def check_region_in_message(message):
    region=loc_chain.invoke(message)
    print(region)
    if region in locations:
        return region
    return None

#景点图片:

from bs4 import BeautifulSoup

import requests
from bs4 import BeautifulSoup
from IPython.display import display, Image

@app.post("/hotspot")
async def get_hotspot(request:Request):
    data =await request.json()
    location =data.get("location","北京")
    
    with open('all.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    # 提取天津的景点名称和图片链接
    hot_spots_with_images = data.get(location, [])

    return JSONResponse({"hotspot":hot_spots_with_images})

if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3100)


# http://127.0.0.1:3100/pages/index.html