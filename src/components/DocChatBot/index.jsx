import React, {useEffect, useMemo, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './styles.css';

const API_URL = 'https://enterprisebot.tier0.dev/chat';

const LIGHT_ICON_URL = 'https://communityimage2.oss-cn-hangzhou.aliyuncs.com/bot.png';
const DARK_ICON_URL = 'https://communityimage2.oss-cn-hangzhou.aliyuncs.com/bot1.png';

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

function getColorMode() {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.getAttribute('data-theme') || 'light';
}

export default function DocChatBot() {
  const lang = useMemo(() => getPageLang(), []);
  const [colorMode, setColorMode] = useState(() => getColorMode());

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;

    const updateColorMode = () => {
      setColorMode(getColorMode());
    };

    updateColorMode();

    const observer = new MutationObserver(updateColorMode);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const botIconUrl = colorMode === 'dark' ? DARK_ICON_URL : LIGHT_ICON_URL;

  const texts = useMemo(() => {
    if (lang === 'zh') {
      return {
        entryTip: '快来问我问题吧',
        welcome: '你好，我可以根据 Tier0 文档回答你的问题。',
        placeholder: '请输入你的问题...',
        title: 'Tier0 文档助手',
        subtitle: '基于 Tier0 文档回答问题',
        send: '发送',
        thinking: '思考中...',
        unavailable: '抱歉，文档助手暂时不可用，请检查 AI Bot API 是否正在运行。',
        noAnswer: '未返回答案。',
        references: '参考文档',
      };
    }

    return {
      entryTip: 'Come and ask me a question',
      welcome: 'Hi, I can help answer questions based on the Tier0 documentation.',
      placeholder: 'Ask about Tier0...',
      title: 'Tier0 Documentation Assistant',
      subtitle: 'Ask questions about Tier0',
      send: 'Send',
      thinking: 'Thinking...',
      unavailable:
        'Sorry, the documentation assistant is temporarily unavailable. Please check whether the AI bot API is running.',
      noAnswer: 'No answer returned.',
      references: 'References',
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
    },
  ]);

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setInput('');

    const userMessage = {
      role: 'user',
      content: text,
      references: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || texts.noAnswer,
          references: data.references || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: texts.unavailable,
          references: [],
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
        {!open && (
          <div className="doc-chatbot-tip">
            {texts.entryTip}
          </div>
        )}

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
              src={botIconUrl}
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
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                            >
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
              onClick={sendMessage}
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