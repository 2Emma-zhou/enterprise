import React, {useEffect, useMemo, useRef, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './styles.css';

const PROD_API_URL = 'https://enterprisebot.tier0.dev/chat';
const LOCAL_API_URL = 'http://127.0.0.1:8001/chat';

const ICON_URL = 'https://enterpriseimage.oss-cn-hangzhou.aliyuncs.com/icon.png';

function getApiUrl() {
  if (typeof window === 'undefined') {
    return PROD_API_URL;
  }

  const host = window.location.hostname;

  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API_URL;
  }

  return PROD_API_URL;
}

function getPageLang() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const path = window.location.pathname.toLowerCase();

  if (path.startsWith('/zh')) {
    return 'zh';
  }

  return 'en';
}

export default function DocChatBot() {
  const lang = useMemo(() => getPageLang(), []);
  const apiUrl = useMemo(() => getApiUrl(), []);
  const messagesEndRef = useRef(null);

  const texts = useMemo(() => {
    if (lang === 'zh') {
      return {
        entryTip: '准备好开始使用 Tier0 了么？',
        welcome: '你好，我是 Tier0 Onboarding 助手，可以根据文档帮你理解产品、完成操作和排查问题。',
        placeholder: '请输入你的问题...',
        title: 'Tier0 Onboarding 助手',
        subtitle: '基于 Tier0 文档帮助你更快上手',
        send: '发送',
        thinking: '思考中...',
        unavailable: '抱歉，文档助手暂时不可用，请检查 AI Bot API 是否正在运行。',
        noAnswer: '未返回答案。',
        references: '参考文档',
        suggestedTitle: '你可以这样问',
        suggestedQuestions: [
          '我该怎么建模？',
          '如何连接数据？',
          '高级一点的数据分析怎么做？',
          'Tier0 的基础操作顺序是什么？',
          '如何创建仪表盘？',
          '如何管理用户和权限？',
        ],
      };
    }

    return {
      entryTip: 'Are you ready to get started with Tier0?',
      welcome:
        'Hi, I am the Tier0 Onboarding Assistant. I can help you understand the product, complete tasks, and troubleshoot issues based on the documentation.',
      placeholder: 'Ask about Tier0...',
      title: 'Tier0 Onboarding Assistant',
      subtitle: 'Guided help based on Tier0 documentation',
      send: 'Send',
      thinking: 'Thinking...',
      unavailable:
        'Sorry, the documentation assistant is temporarily unavailable. Please check whether the AI bot API is running.',
      noAnswer: 'No answer returned.',
      references: 'References',
      suggestedTitle: 'Try asking',
      suggestedQuestions: [
        'How should I build a data model?',
        'How do I connect data?',
        'How can I do more advanced data analysis?',
        'What is the basic workflow for using Tier0?',
        'How do I create a dashboard?',
        'How do I manage users and permissions?',
      ],
    };
  }, [lang]);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: texts.welcome,
      references: [],
      suggestedQuestions: texts.suggestedQuestions,
    },
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, loading, open]);

  const lastMessage = messages[messages.length - 1];
  const currentSuggestedQuestions =
    lastMessage?.role === 'assistant' && lastMessage?.suggestedQuestions?.length
      ? lastMessage.suggestedQuestions
      : texts.suggestedQuestions;

  const shouldShowSuggestions =
    !loading &&
    messages.length > 0 &&
    lastMessage.role === 'assistant' &&
    currentSuggestedQuestions.length > 0;

  async function sendMessage(overrideText) {
    const text = (overrideText || input).trim();

    if (!text || loading) {
      return;
    }

    setInput('');

    const userMessage = {
      role: 'user',
      content: text,
      references: [],
      suggestedQuestions: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          lang,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      const suggestedQuestions =
        Array.isArray(data.suggested_questions) && data.suggested_questions.length > 0
          ? data.suggested_questions
          : texts.suggestedQuestions;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || texts.noAnswer,
          references: data.references || [],
          suggestedQuestions,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: texts.unavailable,
          references: [],
          suggestedQuestions: texts.suggestedQuestions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <div className="doc-chatbot-entry">
        {!open && <div className="doc-chatbot-tip">{texts.entryTip}</div>}

        <button
          className={`doc-chatbot-button ${open ? 'doc-chatbot-button-open' : ''}`}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close AI documentation assistant' : 'Open AI documentation assistant'}
        >
          {open ? (
            <span className="doc-chatbot-close-icon">×</span>
          ) : (
            <img
              className="doc-chatbot-icon"
              src={ICON_URL}
              alt="AI assistant"
            />
          )}
        </button>
      </div>

      {open && (
        <div className="doc-chatbot-panel">
          <div className="doc-chatbot-header">
            <div>
              <div className="doc-chatbot-title">{texts.title}</div>
              <div className="doc-chatbot-subtitle">{texts.subtitle}</div>
            </div>
            <button
              className="doc-chatbot-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="doc-chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`doc-chatbot-message doc-chatbot-message-${message.role}`}
              >
                <div className="doc-chatbot-bubble">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => (
                        <a {...props} target="_blank" rel="noreferrer" />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {message.references && message.references.length > 0 && (
                    <div className="doc-chatbot-references">
                      <div className="doc-chatbot-references-title">
                        {texts.references}
                      </div>
                      <ul>
                        {message.references.map((ref, refIndex) => (
                          <li key={refIndex}>
                            <a href={ref.url} target="_blank" rel="noreferrer">
                              {ref.title}
                            </a>
                            {ref.section ? (
                              <span className="doc-chatbot-section">
                                {' '}
                                · {ref.section}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="doc-chatbot-message doc-chatbot-message-assistant">
                <div className="doc-chatbot-bubble">{texts.thinking}</div>
              </div>
            )}

            {shouldShowSuggestions && (
              <div className="doc-chatbot-suggestions">
                <div className="doc-chatbot-suggestions-title">
                  {texts.suggestedTitle}
                </div>
                <div className="doc-chatbot-suggestions-list">
                  {currentSuggestedQuestions.map((question) => (
                    <button
                      key={question}
                      className="doc-chatbot-suggestion"
                      type="button"
                      onClick={() => sendMessage(question)}
                      disabled={loading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="doc-chatbot-input-area">
            <textarea
              className="doc-chatbot-input"
              placeholder={texts.placeholder}
              value={input}
              rows={2}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="doc-chatbot-send"
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {texts.send}
            </button>
          </div>
        </div>
      )}
    </>
  );
}