let currentSessionId = null; // 默认会话 ID
let chatHistory = {}; // 对象来存储聊天记录
let theme_flag=1;//记录主题
const converter = new showdown.Converter();


/*建议问*/
const suggestedQuestions = [
    "详细介绍该地区的旅游景点。",
    "规划一下旅游路线！",
    "介绍一下该地区的文化特色。",
    "推荐几个适合旅游的城市。",
    "给出去这里旅游的注意事项。",
    "推荐一些特产和美食。",
    "推荐一些纪念品。"
];
function addSuggestedQuestions(messageContainer) {
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.classList.add('suggestions-container');

    // 随机选择一些问题
    const questions = suggestedQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);

    questions.forEach(question => {


        const button = document.createElement('button');
        if(theme_flag==1) {button.classList.add('suggestion-button');}
        else if(theme_flag==2) {button.classList.add('suggestion-button-red');}
        else if(theme_flag==3) {button.classList.add('suggestion-button-orange');}
        else if(theme_flag==4) {button.classList.add('suggestion-button-green');}
        else if(theme_flag==5) {button.classList.add('suggestion-button-blue');}
        else if(theme_flag==6) {button.classList.add('suggestion-button-indigo');}
        else if(theme_flag==7) {button.classList.add('suggestion-button-night');}

        button.textContent = question;
        button.onclick = () => sendRequest(question);
        suggestionsContainer.appendChild(button);

    });

    messageContainer.appendChild(suggestionsContainer);
}
async function sendRequest(originalMessage = null) {
    const userInput = document.getElementById('user-input');
    const languageInput = document.getElementById('language-input');
    const chatBox = document.getElementById('chat-box');

    const messageToSend = originalMessage || userInput.value;

    if (messageToSend.trim() !== "") {
        // 如果没有当前会话 ID，则创建一个新的会话
        if (!currentSessionId) {
            newConversation();
        }

        if (!originalMessage) {
            // 添加用户消息到聊天框
            addMessageToChatBox(messageToSend, 'user', 'image/user.png');

            // 保存用户消息到历史记录
            saveCurrentConversation();

            // 如果这是会话的第一个问题，则设置会话标题
            const conversationItem = document.querySelector(`[data-session-id="${currentSessionId}"]`);
            if (conversationItem && !conversationItem.dataset.firstMessageSet) {
                conversationItem.querySelector('.conversation-title').textContent = messageToSend;
                conversationItem.dataset.firstMessageSet = "true";
            }
        }

        // 发送用户消息到后端
        const data = {
            input: {
                input: messageToSend + `,请用${languageInput.value}来回答`
            },
            config: {
                "configurable": {
                    "session_id": currentSessionId
                }
            }
        };

        const response = await fetch("http://127.0.0.1:3100/chain/stream_log", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let botMessageContent = '';
            const botMessageContainer = addMessageToChatBox('', 'bot', 'image/ai.png', messageToSend, true);

            async function read() {
                const { done, value } = await reader.read();
                if (done) {
                    saveCurrentConversation(); // 保存当前会话
                    addSuggestedQuestions(botMessageContainer); // 添加建议问题////////////
                    return;
                }

                const chunk = decoder.decode(value, { stream: true });
                chunk.split('\r\n').forEach(eventString => {
                    if (eventString && eventString.startsWith('data: ')) {
                        const str = eventString.substring("data: ".length);
                        const data = JSON.parse(str);
                        data.ops.forEach(item => {
                            if (item.op === "add" && item.path === "/logs/ChatOpenAI/streamed_output_str/-") {
                                botMessageContent += item.value;
                                botMessageContainer.querySelector('.message').innerHTML = converter.makeHtml(botMessageContent);
                                chatBox.scrollTop = chatBox.scrollHeight;
                            }
                        });
                    }
                });

                read();
            }

            read();
        } else {
            console.error('Network response was not ok.');
        }

        // 清空输入框
        if (!originalMessage) {
            userInput.value = '';
        }
    }
}


function saveCurrentConversation() {
    const chatBox = document.getElementById('chat-box');
    if (currentSessionId) {
        chatHistory[currentSessionId] = chatBox.innerHTML;
    }
}

function selectConversation(conversationItem) {
    // 清空聊天框并显示选中的会话内容
    const chatBox = document.getElementById('chat-box');
    // 保存当前会话
    saveCurrentConversation();

    currentSessionId = conversationItem.dataset.sessionId;
    chatBox.innerHTML = chatHistory[currentSessionId] || '';
}

function setLanguage(language) {
    const languageInput = document.getElementById('language-input');
    languageInput.value = language;
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendRequest();
    }
}



function deleteConversation(conversationItem) {
    const conversationList = document.getElementById('conversation-list');
    conversationList.removeChild(conversationItem);
    delete chatHistory[conversationItem.dataset.sessionId];

    // 如果删除的是当前会话，清空聊天框
    if (conversationItem.dataset.sessionId === currentSessionId) {
        currentSessionId = null;
        document.getElementById('chat-box').innerHTML = '';
    }
}

function toggleMenu(conversationItem) {
    const menuContent = conversationItem.querySelector('.menu-content');
    menuContent.style.display = menuContent.style.display === 'block' ? 'none' : 'block';
}

function addMessageToChatBox(message, sender, avatar, originalMessage = null, returnContainer = false) {
    const chatBox = document.getElementById('chat-box');
    const messageContainer = document.createElement('div');

    if(theme_flag==1){messageContainer.classList.add('chat-message', sender);}
    else if(theme_flag==2){messageContainer.classList.add('chat-message-red', sender);}
    else if(theme_flag==3){messageContainer.classList.add('chat-message-orange', sender);}
    else if(theme_flag==4){messageContainer.classList.add('chat-message-green', sender);}
    else if(theme_flag==5){messageContainer.classList.add('chat-message-blue', sender);}
    else if(theme_flag==6){messageContainer.classList.add('chat-message-indigo', sender);}
    else if(theme_flag==7){messageContainer.classList.add('chat-message-night', sender);}

    const avatarImage = document.createElement('img');
    avatarImage.src = avatar;
    avatarImage.classList.add('avatar');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message');
    messageContent.innerHTML = converter.makeHtml(message); // 使用 Showdown 转换 Markdown

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const copyButton = document.createElement('button');
    copyButton.innerHTML = '&#x2398;'; // 复制图标
    copyButton.classList.add('copy-button');
    copyButton.title = "复制";
    copyButton.onclick = () => {
        navigator.clipboard.writeText(messageContent.textContent).then(() => {
            alert('文本已复制到剪贴板');
            triggerButtonAnimation(copyButton);
        });
    };

        // 朗读按钮
    const readButton = document.createElement('button');
    readButton.innerHTML = '&#x1f50a;'; // 朗读图标
    readButton.classList.add('read-button');
    readButton.title = "朗读";
    let isSpeaking = false;
    let utterance = null;

    readButton.onclick = () => {
        if (!isSpeaking) {
            
            utterance = new SpeechSynthesisUtterance(messageContent.textContent);
            
            speechSynthesis.speak(utterance);
            console.log(1);
            readButton.innerHTML = '&#x23F8;'; // 暂停图标
            isSpeaking = true;

            utterance.onend = () => {
                readButton.innerHTML = '&#x1f50a;'; // 朗读图标
                isSpeaking = false;
            };
        } else {
            if (speechSynthesis.speaking && !speechSynthesis.paused) {
                speechSynthesis.pause();
                readButton.innerHTML = '&#x25B6;'; // 播放图标
            } else if (speechSynthesis.paused) {
                speechSynthesis.resume();
                readButton.innerHTML = '&#x23F8;'; // 暂停图标
            }
        }
        triggerButtonAnimation(readButton);
    };


    buttonContainer.appendChild(readButton); // 添加朗读按钮

    if (sender === 'bot') {
        const regenerateButton = document.createElement('button');
        regenerateButton.innerHTML = '&#x21bb;'; // 重新生成图标
        regenerateButton.classList.add('regenerate-button');
        regenerateButton.title = "重新生成";
        regenerateButton.onclick = () => {
            sendRequest(originalMessage);
            triggerButtonAnimation(regenerateButton);
        };

        const likeButton = document.createElement('button');
        likeButton.innerHTML = '&#x2714;'; // 点赞图标
        likeButton.classList.add('like-button');
        likeButton.title = "点赞";
        likeButton.onclick = () => {
            alert('你点赞了这条消息');
            triggerButtonAnimation(likeButton);
        };

        const dislikeButton = document.createElement('button');
        dislikeButton.innerHTML = '&#x2718;'; // 点踩图标
        dislikeButton.classList.add('dislike-button');
        dislikeButton.title = "点踩";
        dislikeButton.onclick = () => {
            alert('你点踩了这条消息');
            triggerButtonAnimation(dislikeButton);
        };

        buttonContainer.appendChild(regenerateButton);
        buttonContainer.appendChild(likeButton);
        buttonContainer.appendChild(dislikeButton);
    }

    buttonContainer.appendChild(copyButton);
    messageContainer.appendChild(avatarImage);
    messageContainer.appendChild(messageContent);
    messageContainer.appendChild(buttonContainer);
    chatBox.appendChild(messageContainer);

    chatBox.scrollTop = chatBox.scrollHeight; // 滚动到聊天框底部

    if (returnContainer) {
        return messageContainer;
    }
}
/*加动画*/
function triggerButtonAnimation(button) {
    button.classList.add('button-clicked');
    button.addEventListener('animationend', () => {
        button.classList.remove('button-clicked');
    }, { once: true });
}
function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
    const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';

    document.body.classList.remove(currentTheme);
    document.body.classList.add(newTheme);

    // 保存用户选择的主题到localStorage
    localStorage.setItem('theme', newTheme);
}


document.addEventListener('DOMContentLoaded', () => {
    newConversation();
    // 检查并应用之前保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        document.getElementById('header').classList.add(savedTheme);
        document.querySelector('button.new-conversation').classList.add(savedTheme);
        document.getElementById('conversation-title').classList.add(savedTheme);
        document.querySelectorAll('#conversation-list li').forEach(item => item.classList.add(savedTheme));
        document.getElementById('theme-selector').value = savedTheme;
    }
});


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggle-sidebar');
    const collapsedButton = document.getElementById('toggle-sidebar-collapsed');
    const chatContainer = document.getElementById('chat-container');
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        chatContainer.classList.remove('expanded');
        toggleButton.style.display = 'block';
        collapsedButton.classList.remove('show');
    } else {
        sidebar.classList.add('collapsed');
        chatContainer.classList.add('expanded');
        toggleButton.style.display = 'none';
        collapsedButton.classList.add('show');
    }
}


/*################################### 天气 ################################## */

window.onload = function() {
    getWeatherForecast('北京'); // 默认显示北京的天气
    getHotSpot('北京');
};
//将url提取的内容写入html
async function getWeatherForecast(location) {
    const response = await fetch('http://127.0.0.1:3100/weather', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ location: location }),
    })
    
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.text(); // 先获取响应的文本内容
    })
    .then(text => {
        console.log('Response text:', text); // 打印响应内容
        try {
            return JSON.parse(text); // 尝试将其解析为 JSON
        } catch (e) {
            throw new Error('Invalid JSON: ' + text);
        }
    })
    .then(data => {
        if (!data.weather || !Array.isArray(data.weather)) {
            throw new Error('Invalid data format');
        }
        // 将 location 参数写入 id 为 location_name 的元素
        const locationElement = document.getElementById('location_name');
        if (locationElement) {
            locationElement.textContent = location;
        }
        const weatherItems = data.weather;
        if(weatherItems.length==0){
            for (let i = 1; i <= 7; i++) {
                const weatherElement = document.getElementById(`day-${i}`);
                if (weatherElement) {
                    weatherElement.textContent = "";
                }
            }
            const weatherElement1 = document.getElementById(`day-1`);
            weatherElement1.textContent="对不起！无此地区天气信息。";
        }
        weatherItems.forEach((day, index) => {
            const elementId = `day-${index + 1}`;
            const weatherElement = document.getElementById(elementId);
            if (weatherElement) {
                weatherElement.textContent = day;
                // 提取天气描述部分
                const weatherDescriptions = day.match(/[^,，]+$/);
                if (weatherDescriptions) {
                    const descriptions = weatherDescriptions[0].split(/[转]/); // 使用'转'分隔天气描述
                    descriptions.forEach(description => {
                        description = description.trim(); // 去掉前后空格
                        if (["多云", "晴", "小雨", "中雨", "大雨", "阴", "雷阵雨", "雾","阵雨","暴雨","大暴雨"].includes(description)) {
                            // 创建 img 元素
                            const imgElement = document.createElement('img');
                            // 设置 img 元素的 src 属性
                            imgElement.src = `./climate/${description}.png`;
                            // 将 img 元素添加到 weatherElement 中
                            weatherElement.appendChild(imgElement);
                        }
                    });
                }
            }
        })
    })
    .catch(error => {
        console.error('Error fetching weather:', error);
    });
}

//监听：消息中出现地名
document.addEventListener("DOMContentLoaded", function() {
    const chatContainer = document.getElementById("chat-container");
    const chatInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    // 监听发送按钮点击事件
    sendButton.addEventListener("click", function() {
        handleMessageSubmit();
    });

    // 监听输入框按键事件
    chatInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // 防止回车键的默认行为（如表单提交）
            handleMessageSubmit();
        }
    });

    function handleMessageSubmit() {
        const messageText = chatInput.value.trim();
        if (messageText !== "") {
            // 将消息发送到后端处理
            fetch("http://localhost:3100/process_message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: messageText })
            })
            .then(response => response.json())
            .then(data => {
                if(data.region){
                    getWeatherForecast(data.region);
                    getHotSpot(data.region);
                }else {
                    const locationElement = document.getElementById('location_name');
                    
                    const nameElement = document.getElementById('attraction-name');
                    const imageElement = document.getElementById('attraction-image');
                    nameElement.textContent = "无";
                    imageElement.src = "NotFound.jpg";
                    locationElement.textContent = "未检测到中国城市";
                    
                    for (let i = 1; i <= 7; i++) {
                        const weatherElement = document.getElementById(`day-${i}`);
                        if (weatherElement) {
                            weatherElement.textContent = "";
                        }
                    }
                }
            })
            .catch(error => console.error("Error:", error));
        }
    }
});

// 这是景点图片栏目


//gethotspot
let currentIndex = 0;
let hotspots2={};
const nameElement = document.getElementById('attraction-name');
const imageElement = document.getElementById('attraction-image');
function updateSlider(hotspots) {
    if (hotspots.length <= 0) {
        nameElement.textContent = 'No hotspots available';
        imageElement.src = '';
    }
    else {
        hotspots2=hotspots;
        currentIndex=0;
        console.log(111);
        nameElement.textContent = hotspots[currentIndex]["景点名称"];
        imageElement.src = hotspots[currentIndex]["图片链接"];
        imageElement.onerror = () => {
            nextImage();
        };
    }
}

function previousImage() {
    const nameElement = document.getElementById('attraction-name');
    const imageElement = document.getElementById('attraction-image');
    if(nameElement.textContent!="无"&&nameElement.textContent!="无此地区景点图像信息"){
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : hotspots2.length - 1;
        
        nameElement.textContent = hotspots2[currentIndex]["景点名称"];
        imageElement.src = hotspots2[currentIndex]["图片链接"];
        imageElement.onerror = () => {
            previousImage();
        };
    }
}

function nextImage() {
    const nameElement = document.getElementById('attraction-name');
    const imageElement = document.getElementById('attraction-image');
    if(nameElement.textContent!="无"&&nameElement.textContent!="无此地区景点图像信息"){
        currentIndex = (currentIndex < hotspots2.length - 1) ? currentIndex + 1 : 0;
        
        nameElement.textContent = hotspots2[currentIndex]["景点名称"];
        imageElement.src = hotspots2[currentIndex]["图片链接"];
        imageElement.onerror = () => {
            nextImage();
        };
    }
}

async function getHotSpot(location) {
    try {
        console.log(111);
        const response = await fetch("http://127.0.0.1:3100/hotspot", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location: location }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const text = await response.text(); // 先获取响应的文本内容
        let data;

        try {
            data = JSON.parse(text); // 尝试将其解析为 JSON
        } catch (e) {
            throw new Error('Invalid JSON: ' + text);
        }
        
        // 更新滑块内容
        if(data.hotspot.length!=0){
            updateSlider(data.hotspot); // 假设 data.hotspot 是你需要的数组
        }
        else{
            const nameElement = document.getElementById('attraction-name');
            const imageElement = document.getElementById('attraction-image');
            nameElement.textContent = "无此地区景点图像信息";
            imageElement.src = "NotFound.jpg";
        }

    } catch (error) {
        console.error('Error fetching hotspot:', error);
    }
}



// 这是景点图片栏目


function toggleSidebarRight() {
    const sidebarRight = document.getElementById('sidebar_right');
    const toggleButtonRight = document.getElementById('toggle-sidebar-right');
    const collapsedButtonRight = document.getElementById('toggle-sidebar-right-collapsed');
    const chatContainer = document.getElementById('chat-container');
    if (sidebarRight.classList.contains('collapsed')) {
        sidebarRight.classList.remove('collapsed');
        chatContainer.classList.remove('expanded-right');
        toggleButtonRight.style.display = 'block';
        collapsedButtonRight.classList.remove('show');
    } else {
        sidebarRight.classList.add('collapsed');
        chatContainer.classList.add('expanded-right');
        toggleButtonRight.style.display = 'none';
        collapsedButtonRight.classList.add('show');
    }
}

function applyTheme(theme) {
    const themes = ['red-theme', 'orange-theme', 'light-theme', 'green-theme', 'blue-theme', 'indigo-theme', 'night-theme'];
    if (theme=='light-theme') {theme_flag=1;}
    else if (theme=='red-theme') {theme_flag=2;}
    else if (theme=='orange-theme') {theme_flag=3;}
    else if (theme=='green-theme') {theme_flag=4;}
    else if (theme=='blue-theme') {theme_flag=5;}
    else if (theme=='indigo-theme') {theme_flag=6;}
    else if (theme=='night-theme') {theme_flag=7;}

    themes.forEach(t => {
        document.body.classList.remove(t);
        document.getElementById('header').classList.remove(t);
        document.querySelector('.title-container').classList.remove(t);
        document.querySelectorAll('.toggle-sidebar').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.toggle-sidebar-collapsed').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.toggle-sidebar-right').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.toggle-sidebar-right-collapsed').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.sidebar ul li').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.menu-content button').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.custom-dialog button').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.custom-confirm button').forEach(el => el.classList.remove(t));
        document.getElementById('send-button').classList.remove(t);
        document.querySelector('button.new-conversation').classList.remove(t);


        //新增主题
        document.querySelector('.chat-container').classList.remove(t);
        document.querySelector('.chat-box').classList.remove(t);
        document.querySelector('.input-box').classList.remove(t);
        document.querySelectorAll('.language-input').forEach(el => el.classList.remove(t));
        document.querySelector('.user-input').classList.remove(t);
        document.querySelector('.sidebar').classList.remove(t);
        document.querySelector('.sidebar_right').classList.remove(t);
        document.querySelector('.bottom-section').classList.remove(t);
        document.querySelector('.top-section').classList.remove(t);
        document.querySelectorAll('.image-button').forEach(el => el.classList.remove(t));
        document.querySelector('.location_name').classList.remove(t);
        document.querySelector('.weather-title-container').classList.remove(t);
        document.querySelectorAll('.suggestion-button').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.suggestion-button-night').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.suggestion-button-red').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.suggestion-button-orange').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.suggestion-button-green').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.suggestion-button-blue').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.suggestion-button-indigo').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message.user .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-night .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-red .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-orange .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-green .message').forEach(el => el.classList.remove(t));

        document.querySelectorAll('.chat-message-indigo .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-night.user .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-red.user .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-orange.user .message').forEach(el => el.classList.remove(t));
        document.querySelectorAll('.chat-message-green.user .message').forEach(el => el.classList.remove(t));

        document.querySelectorAll('.chat-message-indigo.user .message').forEach(el => el.classList.remove(t));
    });

    document.body.classList.add(theme);
    document.getElementById('header').classList.add(theme);
    document.querySelector('.title-container').classList.add(theme);
    document.querySelectorAll('.toggle-sidebar').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.toggle-sidebar-collapsed').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.toggle-sidebar-right').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.toggle-sidebar-right-collapsed').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.sidebar ul li').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.menu-content button').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.custom-dialog button').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.custom-confirm button').forEach(el => el.classList.add(theme));
    document.getElementById('send-button').classList.add(theme);
    document.querySelector('button.new-conversation').classList.add(theme);


    //新增主题
    document.querySelector('.chat-container').classList.add(theme);
    document.querySelector('.chat-box').classList.add(theme);
    document.querySelector('.input-box').classList.add(theme);
    document.querySelectorAll('.language-input').forEach(el => el.classList.add(theme));
    document.querySelector('.user-input').classList.add(theme);
    document.querySelector('.sidebar').classList.add(theme);
    document.querySelector('.sidebar_right').classList.add(theme);
    document.querySelector('.bottom-section').classList.add(theme);
    document.querySelector('.top-section').classList.add(theme);
    document.querySelectorAll('.image-button').forEach(el => el.classList.add(theme));
    document.querySelector('.location_name').classList.add(theme);
    document.querySelector('.weather-title-container').classList.add(theme);
    document.querySelectorAll('.suggestion-button').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.suggestion-button-night').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.suggestion-button-red').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.suggestion-button-orange').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.suggestion-button-green').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.suggestion-button-blue').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.suggestion-button-indigo').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message.user .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-red .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-orange .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-green .message').forEach(el => el.classList.add(theme));

    document.querySelectorAll('.chat-message-indigo .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-night .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-red.user .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-orange.user .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-green.user .message').forEach(el => el.classList.add(theme));

    document.querySelectorAll('.chat-message-indigo.user .message').forEach(el => el.classList.add(theme));
    document.querySelectorAll('.chat-message-night.user .message').forEach(el => el.classList.add(theme));
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }
});

function changeTheme(theme) {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
}


function newConversation() {
    const conversationList = document.getElementById('conversation-list');
    const chatBox = document.getElementById('chat-box');
    saveCurrentConversation();
    currentSessionId = "session_" + Date.now();

    let conversationCount = conversationList.childElementCount + 1;
    const newConversationItem = document.createElement('li');
    newConversationItem.classList.add('conversation-item');
    newConversationItem.onclick = () => selectConversation(newConversationItem);
    newConversationItem.dataset.sessionId = currentSessionId;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = `会话 ${conversationCount}`;
    titleSpan.classList.add('conversation-title');
    newConversationItem.appendChild(titleSpan);

    const currentTheme = document.body.classList[0];
    newConversationItem.classList.add(currentTheme);

    const menuButton = document.createElement('button');
    menuButton.classList.add('menu-button');
    menuButton.innerHTML = '...';
    menuButton.onclick = (event) => {
        event.stopPropagation();
        toggleMenu(newConversationItem);
    };

    const menuContent = document.createElement('div');
    menuContent.classList.add('menu-content');

    const renameButton = document.createElement('button');
    renameButton.textContent = '重命名';
    renameButton.onclick = (event) => {
        event.stopPropagation();
        showRenameDialog(newConversationItem, event);
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.onclick = (event) => {
        event.stopPropagation();
        showDeleteConfirm(newConversationItem, event);
    };

    if (currentTheme) {
        menuButton.classList.add(currentTheme);
        renameButton.classList.add(currentTheme);
        deleteButton.classList.add(currentTheme);
    }

    menuContent.appendChild(renameButton);
    menuContent.appendChild(deleteButton);
    menuButton.appendChild(menuContent);
    newConversationItem.appendChild(menuButton);
    conversationList.appendChild(newConversationItem);

    chatBox.innerHTML = '';
    chatHistory[currentSessionId] = [];
}

function showRenameDialog(conversationItem, event) {
    const dialog = document.createElement('div');
    dialog.classList.add('custom-dialog');
    dialog.style.top = `${event.clientY}px`;
    dialog.style.left = `${event.clientX}px`;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = conversationItem.querySelector('.conversation-title').textContent;
    input.className = 'language-input';//加个类

    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.onclick = () => {
        renameConversation(conversationItem, input.value);
        document.body.removeChild(dialog);
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        document.body.removeChild(dialog);
    };

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            renameConversation(conversationItem, input.value);
            document.body.removeChild(dialog);
        }
    });

    dialog.appendChild(input);
    dialog.appendChild(confirmButton);
    dialog.appendChild(cancelButton);
    document.body.appendChild(dialog);

    input.focus();

    const currentTheme = document.body.classList[0];
    if (currentTheme) {
        confirmButton.classList.add(currentTheme);
        cancelButton.classList.add(currentTheme);
    }
}

function showDeleteConfirm(conversationItem, event) {
    const confirmBox = document.createElement('div');
    confirmBox.classList.add('custom-confirm');
    confirmBox.style.top = `${event.clientY}px`;
    confirmBox.style.left = `${event.clientX}px`;

    const message = document.createElement('div');
    message.textContent = '确定要删除这个会话吗？';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.onclick = () => {
        deleteConversation(conversationItem);
        document.body.removeChild(confirmBox);
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        document.body.removeChild(confirmBox);
    };

    confirmBox.appendChild(message);
    confirmBox.appendChild(confirmButton);
    confirmBox.appendChild(cancelButton);
    document.body.appendChild(confirmBox);

    const currentTheme = document.body.classList[0];
    if (currentTheme) {
        confirmButton.classList.add(currentTheme);
        cancelButton.classList.add(currentTheme);
    }
}
