import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { useConfig } from "~/Contexts/ConfigContext";
import styles from "./ChatManager.module.scss";
import CTVList from "~/Components/CTVList/CTVList";
import { ArrowBack } from "@mui/icons-material";
import { Button } from "@mui/material";

const cx = classNames.bind(styles);

function ChatManager() {
  const { config } = useConfig();
  const { ctvId } = useParams();
  const navigate = useNavigate();
  const [customerList, setCustomerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState({});
  const [messages, setMessages] = useState({});
  const [mobileView, setMobileView] = useState("ctv");

  useEffect(() => {
    if (!ctvId || !config?.get_chat) return;

    // reset
    setOpenChats([]);
    setActiveChat(null);
    setMessages({});
    setNewMessage({});
    localStorage.removeItem("openChats");
    localStorage.removeItem("activeChat");

    fetch(config.get_chat, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
      },
      body: JSON.stringify({ ctvId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCustomerList(data[0]?.listCtv || []);
      })
      .catch((err) => console.error("Lỗi lấy danh sách khách:", err));
  }, [ctvId, config]);

  // Lấy tin nhắn
  const getMessages = async (ctvId, uidFrom) => {
    if (!config?.get_message) return [];
    try {
      const res = await fetch(config.get_message, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({ ctvId, uidFrom }),
      });
      const data = await res.json();
      return data[0]?.messageChats || [];
    } catch (err) {
      console.error("Lỗi lấy tin nhắn:", err);
      return [];
    }
  };

  // Khôi phục trạng thái từ localStorage
  const getInitialOpenChats = () => {
    try {
      const saved = localStorage.getItem("openChats");
      if (saved) {
        return JSON.parse(saved); // ✅ Lấy danh sách đã lưu
      }
    } catch (error) {
      console.error("Error loading saved chats:", error);
    }
    return [];
  };

  const getInitialActiveChat = () => {
    try {
      const saved = localStorage.getItem("activeChat");
      if (saved) {
        const activeChatId = JSON.parse(saved);
        // Kiểm tra xem activeChat có tồn tại trong openChats không
        const openChats = getInitialOpenChats();
        if (openChats.find((chat) => chat.id === activeChatId)) {
          return activeChatId;
        }
      }
    } catch (error) {
      console.error("Error loading active chat:", error);
    }
    return null;
  };

  const [openChats, setOpenChats] = useState(getInitialOpenChats());
  const [activeChat, setActiveChat] = useState(getInitialActiveChat());

  // Lưu trạng thái vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem("openChats", JSON.stringify(openChats));
    } catch (error) {
      console.error("Error saving open chats:", error);
    }
  }, [openChats]);

  useEffect(() => {
    try {
      localStorage.setItem("activeChat", JSON.stringify(activeChat));
    } catch (error) {
      console.error("Error saving active chat:", error);
    }
  }, [activeChat]);

  // Lọc danh sách hội thoại theo từ khóa tìm kiếm
  const filteredConversations = customerList.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log(filteredConversations, "filteredConversations");

  // Mở hội thoại chat
  const openChat = async (conversation) => {
    if (!openChats.find((chat) => chat.id === conversation.id)) {
      setOpenChats([...openChats, conversation]);
    }
    setActiveChat(conversation.id);

    const msgs = await getMessages(conversation.id_nick_zalo, conversation.id);

    const mapped = msgs.map((m, index) => ({
      id: m.id || index,
      text: m.content,
      sender: m.is_selt === "true" ? "me" : "other",
      time: new Date(Number(m.time)).toLocaleString("vi-VN"),
      avatar: m.avatar || "/default-avatar.png", // ✅ dùng avatar từ API
      isSystemMessage: false,
    }));

    setMessages((prev) => ({
      ...prev,
      [conversation.id]: mapped,
    }));

    // Tự động cuộn xuống tin nhắn mới nhất sau khi load tin nhắn
    setTimeout(() => {
      const chatMessagesElement = document.querySelector(
        `.chat-window[data-chat-id="${conversation.id}"] .chat-messages`
      );
      if (chatMessagesElement) {
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
      }
    }, 100);
  };

  // Đóng hội thoại chat
  const closeChat = (chatId) => {
    const updatedChats = openChats.filter((chat) => chat.id !== chatId);
    setOpenChats(updatedChats);

    if (activeChat === chatId) {
      if (updatedChats.length > 0) {
        setActiveChat(updatedChats[updatedChats.length - 1].id);
      } else {
        setActiveChat(null);
        // 👇 Chuyển về danh sách hội thoại nếu ở mobile
        if (isMobile()) {
          setMobileView("conversation");
        }
      }
    }
  };

  // Đặt chat làm active
  const setActiveChatHandler = (chatId) => {
    setActiveChat(chatId);
  };

  // Tính toán số hàng và cột của popup đang mở
  const calculateGridInfo = () => {
    if (openChats.length === 0) {
      return "Chưa có popup";
    }

    if (isMobile()) {
      return `${openChats.length} popup (1 cột)`;
    }

    const chatWidth = 320;
    const availableWidth = window.innerWidth - 340; // trừ sidebar width
    const maxChatsPerRow = Math.floor(availableWidth / chatWidth);
    const actualChatsPerRow = Math.min(maxChatsPerRow, openChats.length);
    const totalRows = Math.ceil(openChats.length / actualChatsPerRow);

    return `${openChats.length} popup (${actualChatsPerRow}x${totalRows})`;
  };

  // Kiểm tra xem có cần cuộn không
  const needsScrolling = () => {
    if (window.innerWidth <= 768) return false; // Mobile không cần logic này

    const chatWidth = 320;
    const availableWidth = window.innerWidth - 340;
    const maxChatsPerRow = Math.floor(availableWidth / chatWidth);
    const totalRows = Math.ceil(openChats.length / maxChatsPerRow);
    const chatHeight = 420;
    const availableHeight = window.innerHeight - 60; // 60px for header

    return totalRows * chatHeight > availableHeight;
  };

  // Kiểm tra xem có phải mobile không
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  return (
    <>
      <div className={cx("main-content")}>
        {isMobile() ? (
          <>
            {mobileView === "ctv" && (
              <div className={cx("mobile-ctv")}>
                <div className={cx("wrapper-header-mobile")}>
                  <button
                    className={cx("back-button")}
                    onClick={() => navigate("/manager-page")}
                  >
                    <ArrowBack fontSize="small" />
                    Quay lại trang quan lý
                  </button>
                </div>
                <CTVList onSelect={() => setMobileView("conversation")} />
              </div>
            )}

            {mobileView === "conversation" && (
              <div className={cx("mobile-conversation")}>
                <div className={cx("wrapper-header-mobile")}>
                  <button
                    className={cx("back-button")}
                    onClick={() => setMobileView("ctv")}
                  >
                    <ArrowBack /> Quay lại CTV
                  </button>
                </div>
                {/* danh sách hội thoại */}
                {ctvId && (
                  <div className={cx("conversation-section")}>
                    <div className={cx("sidebar-header")}>
                      <h3>
                        <i className="fas fa-comment-dots"></i>
                        Trò chuyện
                      </h3>
                      <div className={cx("widget-info")}>
                        <span className={cx("widget-count")}>
                          {calculateGridInfo()}
                        </span>
                      </div>
                    </div>

                    <div className={cx("search-box")}>
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="Tìm kiếm cuộc trò chuyện..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className={cx("status-filter")}>
                      <span className={cx("status-item", "active")}>
                        <i className="fas fa-circle"></i>
                        Đã kết nối
                      </span>
                    </div>

                    <div className={cx("conversation-list")}>
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={cx("conversation-item", {
                            active: activeChat === conversation.id,
                          })}
                          onClick={() => {
                            openChat(conversation);
                            setMobileView("chat"); // ✅ thêm dòng này
                          }}
                        >
                          <div className={cx("avatar-container")}>
                            <img
                              src={conversation.avatar}
                              alt={conversation.name}
                            />
                          </div>
                          <div className={cx("conversation-info")}>
                            <div className={cx("conversation-header")}>
                              <span className={cx("name")}>
                                {conversation.name}
                              </span>
                              <span className={cx("time")}>
                                {new Date(
                                  Number(conversation.time)
                                ).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className={cx("conversation-preview")}>
                              <span className={cx("last-message")}>
                                {conversation.recentChat}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mobileView === "chat" && activeChat && (
              <div className={cx("mobile-chat")}>
                <div className={cx("header")}>
                  <div className={cx("header-left", "mobile-header")}>
                    <Button
                      className={cx("back-button")}
                      onClick={() => setMobileView("conversation")}
                      variant="contained"
                      sx={{
                        backgroundColor: "#764ba2",
                        marginBottom: "10px",
                      }}
                    >
                      <ArrowBack sx={{ color: "#fff" }} />
                    </Button>
                    <button
                      className={cx("back-button")}
                      onClick={() => navigate("/manager-page")}
                    >
                      <ArrowBack fontSize="small" />
                      Quay lại trang quan lý
                    </button>
                    <button
                      className={cx("back-button")}
                      onClick={() => {
                        // Clear hết popup đã chọn
                        setOpenChats([]);
                        setActiveChat(null);
                        setMessages({});
                        setNewMessage({});
                        // Clear localStorage
                        localStorage.removeItem("openChats");
                        localStorage.removeItem("activeChat");

                        // 👇 Thêm dòng này để tránh trắng màn
                        if (isMobile()) {
                          setMobileView("conversation");
                        }
                      }}
                    >
                      <i className="fas fa-times-circle"></i>
                      Đóng tất cả popup
                    </button>
                  </div>
                  <div className={cx("header-right")}></div>
                </div>
                {openChats
                  .filter((c) => c.id === activeChat)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={cx("chat-window", "chat-mobile")}
                    >
                      <div
                        className={cx("chat-windows", {
                          scrollable: needsScrolling(),
                          "mobile-layout": isMobile(),
                          "desktop-layout": !isMobile(),
                        })}
                      >
                        {openChats.map((chat, index) => (
                          <div
                            key={chat.id}
                            className={cx("chat-window", {
                              active: activeChat === chat.id,
                            })}
                            data-chat-id={chat.id}
                            style={{
                              zIndex:
                                1000 +
                                index +
                                (activeChat === chat.id ? 100 : 0),
                            }}
                            onClick={() => setActiveChatHandler(chat.id)}
                          >
                            {/* Chat Header */}
                            <div className={cx("chat-header")}>
                              <div className={cx("chat-header-left")}>
                                <img src={chat.avatar} alt={chat.name} />
                                <div className={cx("chat-info")}>
                                  <span className={cx("chat-name")}>
                                    {chat.name}
                                  </span>
                                </div>
                              </div>
                              <div className={cx("chat-header-right")}>
                                <i className="fas fa-info-circle"></i>
                                <i
                                  className="fas fa-times"
                                  onClick={() => closeChat(chat.id)}
                                ></i>
                              </div>
                            </div>

                            {/* Chat Messages */}
                            <div className={cx("chat-messages")}>
                              {messages[chat.id]?.map((message) => (
                                <div
                                  key={message.id}
                                  className={cx("message", {
                                    "message-me": message.sender === "me",
                                    "message-other": message.sender === "other",
                                    "message-system":
                                      message.sender === "system",
                                  })}
                                >
                                  {message.sender === "other" && (
                                    <img
                                      src={message.avatar}
                                      alt="Avatar"
                                      className={cx("message-avatar")}
                                    />
                                  )}
                                  <div className={cx("message-content")}>
                                    {message.isSystemMessage ? (
                                      <div className={cx("system-message")}>
                                        {message.text}
                                      </div>
                                    ) : (
                                      <div className={cx("message-bubble")}>
                                        {message.text}
                                      </div>
                                    )}
                                    <div className={cx("message-time")}>
                                      {message.time}
                                    </div>
                                  </div>
                                  {message.sender === "me" && (
                                    <div className={cx("message-status")}>
                                      <i className="fas fa-check"></i>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Chat Input */}
                            <div className={cx("chat-input")}>
                              <div className={cx("input-container")}>
                                <i className="fas fa-paperclip"></i>
                                <i className="fas fa-image"></i>
                                <i className="fas fa-smile"></i>
                                <i className="fas fa-bolt"></i>
                                <input
                                  type="text"
                                  placeholder="Nhập tin nhắn..."
                                  value={newMessage[chat.id] || ""}
                                  onChange={(e) =>
                                    setNewMessage({
                                      ...newMessage,
                                      [chat.id]: e.target.value,
                                    })
                                  }
                                />
                                <i className="fas fa-paper-plane"></i>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          // giao diện desktop cũ (sidebar + chat-area)
          <div className={cx("chat-manager")}>
            {/* Header luôn hiển thị */}
            <div className={cx("header")}>
              <div className={cx("header-left", "desktop-header")}>
                <button
                  className={cx("back-button")}
                  onClick={() => navigate("/manager-page")}
                >
                  <ArrowBack fontSize="small" />
                  Quay lại trang quan lý
                </button>
                <button
                  className={cx("back-button")}
                  onClick={() => {
                    // Clear hết popup đã chọn
                    setOpenChats([]);
                    setActiveChat(null);
                    setMessages({});
                    setNewMessage({});
                    // Clear localStorage
                    localStorage.removeItem("openChats");
                    localStorage.removeItem("activeChat");
                  }}
                >
                  <i className="fas fa-times-circle"></i>
                  Đóng tất cả popup
                </button>
              </div>
              <div className={cx("header-right")}></div>
            </div>

            <div className={cx("main-content")}>
              {/* Sidebar luôn hiện */}
              <div className={cx("sidebar")}>
                {/* Phần danh sách CTV */}
                <div className={cx("ctv-section")}>
                  <CTVList />
                </div>

                {/* Phần danh sách hội thoại chỉ hiện khi chọn CTV */}
                {ctvId && (
                  <div className={cx("conversation-section")}>
                    <div className={cx("sidebar-header")}>
                      <h3>
                        <i className="fas fa-comment-dots"></i>
                        Trò chuyện
                      </h3>
                      <div className={cx("widget-info")}>
                        <span className={cx("widget-count")}>
                          {calculateGridInfo()}
                        </span>
                      </div>
                    </div>

                    <div className={cx("search-box")}>
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="Tìm kiếm cuộc trò chuyện..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className={cx("status-filter")}>
                      <span className={cx("status-item", "active")}>
                        <i className="fas fa-circle"></i>
                        Đã kết nối
                      </span>
                    </div>

                    <div className={cx("conversation-list")}>
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={cx("conversation-item", {
                            active: activeChat === conversation.id,
                          })}
                          onClick={() => openChat(conversation)}
                        >
                          <div className={cx("avatar-container")}>
                            <img
                              src={conversation.avatar}
                              alt={conversation.name}
                            />
                          </div>
                          <div className={cx("conversation-info")}>
                            <div className={cx("conversation-header")}>
                              <span className={cx("name")}>
                                {conversation.name}
                              </span>
                              <span className={cx("time")}>
                                {new Date(
                                  Number(conversation.time)
                                ).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className={cx("conversation-preview")}>
                              <span className={cx("last-message")}>
                                {conversation.recentChat}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Khu vực chat hoặc thông báo */}
              <div className={cx("chat-area")}>
                {!ctvId ? (
                  <div className={cx("no-selected")}>
                    <h2
                      style={{
                        color: "#fff",
                        width: "100%",
                        height: "100vh",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Vui lòng chọn CTV từ danh sách bên trái
                    </h2>
                  </div>
                ) : (
                  <div
                    className={cx("chat-windows", {
                      scrollable: needsScrolling(),
                      "mobile-layout": isMobile(),
                      "desktop-layout": !isMobile(),
                    })}
                  >
                    {openChats.map((chat, index) => (
                      <div
                        key={chat.id}
                        className={cx("chat-window", {
                          active: activeChat === chat.id,
                        })}
                        data-chat-id={chat.id}
                        style={{
                          zIndex:
                            1000 + index + (activeChat === chat.id ? 100 : 0),
                        }}
                        onClick={() => setActiveChatHandler(chat.id)}
                      >
                        {/* Chat Header */}
                        <div className={cx("chat-header")}>
                          <div className={cx("chat-header-left")}>
                            <img src={chat.avatar} alt={chat.name} />
                            <div className={cx("chat-info")}>
                              <span className={cx("chat-name")}>
                                {chat.name}
                              </span>
                            </div>
                          </div>
                          <div className={cx("chat-header-right")}>
                            <i className="fas fa-info-circle"></i>
                            <i
                              className="fas fa-times"
                              onClick={() => closeChat(chat.id)}
                            ></i>
                          </div>
                        </div>

                        {/* Chat Messages */}
                        <div className={cx("chat-messages")}>
                          {messages[chat.id]?.map((message) => (
                            <div
                              key={message.id}
                              className={cx("message", {
                                "message-me": message.sender === "me",
                                "message-other": message.sender === "other",
                                "message-system": message.sender === "system",
                              })}
                            >
                              {message.sender === "other" && (
                                <img
                                  src={message.avatar}
                                  alt="Avatar"
                                  className={cx("message-avatar")}
                                />
                              )}
                              <div className={cx("message-content")}>
                                {message.isSystemMessage ? (
                                  <div className={cx("system-message")}>
                                    {message.text}
                                  </div>
                                ) : (
                                  <div className={cx("message-bubble")}>
                                    {message.text}
                                  </div>
                                )}
                                <div className={cx("message-time")}>
                                  {message.time}
                                </div>
                              </div>
                              {message.sender === "me" && (
                                <div className={cx("message-status")}>
                                  <i className="fas fa-check"></i>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Chat Input */}
                        <div className={cx("chat-input")}>
                          <div className={cx("input-container")}>
                            <i className="fas fa-paperclip"></i>
                            <i className="fas fa-image"></i>
                            <i className="fas fa-smile"></i>
                            <i className="fas fa-bolt"></i>
                            <input
                              type="text"
                              placeholder="Nhập tin nhắn..."
                              value={newMessage[chat.id] || ""}
                              onChange={(e) =>
                                setNewMessage({
                                  ...newMessage,
                                  [chat.id]: e.target.value,
                                })
                              }
                            />
                            <i className="fas fa-paper-plane"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatManager;
