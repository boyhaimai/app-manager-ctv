import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { useConfig } from "~/Contexts/ConfigContext";
import CTVList from "~/Components/CTVList/CTVList";
import { ArrowBack, Close, Menu } from "@mui/icons-material";
import { Button, Dialog, Drawer } from "@mui/material";

import styles from "./ChatManager.module.scss";

const cx = classNames.bind(styles);

function ChatManager() {
  const { config } = useConfig();
  const { ctvId } = useParams();
  const navigate = useNavigate();

  const [customerList, setCustomerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // từ khóa áp dụng thực tế
  const [newMessage, setNewMessage] = useState({});
  const [messages, setMessages] = useState({});
  const [mobileView, setMobileView] = useState("ctv");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const [msgPage, setMsgPage] = useState({}); // lưu page cho từng hội thoại
  const [msgHasMore, setMsgHasMore] = useState({});
  const [msgLoading, setMsgLoading] = useState(false);
  const [openChats, setOpenChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);

  const limit = 20;

  // ✅ Helper: kiểm tra file là ảnh hay video
  const isImageFile = (url = "") =>
    url.includes("img_") || url.includes("zalo_");
  const isVideoFile = (url = "") => url.includes("video");

  // --- Thêm helper function ở đầu component (ví dụ ngay sau const limit = 20;)
  const scrollDialogToChat = (chatId, smooth = true) => {
    const chatDialog = document.querySelector("[data-chat-dialog]");
    const chatWindow = document.querySelector(`[data-chat-id="${chatId}"]`);

    if (!chatDialog || !chatWindow) return false;

    const dialogRect = chatDialog.getBoundingClientRect();
    const winRect = chatWindow.getBoundingClientRect();

    // tính top tương đối trong container có cuộn
    const top = winRect.top - dialogRect.top + chatDialog.scrollTop;

    chatDialog.scrollTo({
      top,
      behavior: smooth ? "smooth" : "auto",
    });

    return true;
  };

  const scrollDesktopToChat = (chatId, smooth = true) => {
    const chatWindows = document.querySelector(`.${cx("chat-windows")}`);
    const chatWindow = document.querySelector(`[data-chat-id="${chatId}"]`);

    if (!chatWindows || !chatWindow) return false;

    const parentRect = chatWindows.getBoundingClientRect();
    const winRect = chatWindow.getBoundingClientRect();

    const top = winRect.top - parentRect.top + chatWindows.scrollTop;

    chatWindows.scrollTo({
      top,
      behavior: smooth ? "smooth" : "auto",
    });

    return true;
  };

  const loadConversations = async (ctvId, pageNum) => {
    if (!config?.get_chat || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(config.get_chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({
          ctvId,
          limit,
          offset: pageNum * limit,
        }),
      });

      if (!res.ok) {
        console.error("API lỗi:", res.status, res.statusText);
        setHasMore(false);
        setIsLoading(false);

        if (loaderRef.current) {
          // const scrollContainer = document.querySelector(
          //   `.${cx("conversation-list")}`
          // );
          const observer = new IntersectionObserver(() => {});
          observer.disconnect(); // ❌ stop luôn
        }

        return;
      }

      const data = await res.json();
      let newList = data[0]?.listCtv || [];

      // Map rõ ràng: partnerId (uid_from), ctvId (id_nickzalo), tên sender/ctv, avatar, time...
      newList = newList
        .map((item) => {
          // API trả về các trường: uid_from (partner), sender_name, is_self, ctv_id, ctv_name, avatar, recentChat, time
          const partnerId = item.uid_from || null;
          const ctvIdFromApi = item.ctv_id || null;
          const name =
            item.sender_name || item.ctv_name || item.name || "Không tên";

          return {
            // dùng partnerId làm id hiển thị/ key popup nếu có, fallback sang ctvId (chỉ khi partnerId null)
            id: partnerId || ctvIdFromApi,
            partnerId,
            ctvId: ctvIdFromApi,
            name,
            avatar:
              item.avatar && item.avatar.trim() !== ""
                ? item.avatar
                : "https://stc-zaloprofile.zdn.vn/pc/v1/images/zalo_sharelogo.png",
            time: item.time,
            recentChat: item.recentChat,
            href: item.href,
          };
        })
        // Lọc bỏ item không hợp lệ (cần có ít nhất id và name)
        .filter((item) => item.id && item.name);

      if (newList.length < limit) setHasMore(false);
      setCustomerList((prev) => {
        const merged = [...prev, ...newList];
        const unique = merged.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
        return unique;
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách khách:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 500); // dừng gõ 0.5s mới search

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset và load lần đầu khi đổi CTV
  // Reset và load lần đầu khi đổi CTV
  useEffect(() => {
    if (!ctvId) return;

    // Clear popup, chat cũ
    setOpenChats([]);
    setActiveChat(null);
    setMessages({});
    setNewMessage({});
    setMsgPage({});
    setMsgHasMore({}); // ✅ reset trạng thái còn tin nhắn không
    localStorage.removeItem("openChats");
    localStorage.removeItem("activeChat");

    // Reset danh sách hội thoại
    setCustomerList([]);
    setPage(0);
    setHasMore(true);

    loadConversations(ctvId, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctvId, config]);

  useEffect(() => {
    if (ctvId && page > 0) {
      loadConversations(ctvId, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ctvId]);

  const getMessages = async (ctvId, uidFrom, page = 0, limit = 20) => {
    if (!config?.get_message) return [];
    try {
      const res = await fetch(config.get_message, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({
          ctvId,
          uidFrom,
          limit,
          offset: page * limit,
        }),
      });
      if (!res.ok) {
        console.error("API lỗi:", res.status);
        return [];
      }
      const data = await res.json();
      return data[0]?.messageChats || [];
    } catch (err) {
      console.error("Lỗi lấy tin nhắn:", err);
      return [];
    }
  };

  const loadMessages = async (ctvId, uidFrom, page = 0, limit = 20) => {
    if (!config?.get_message || msgLoading) return [];
    setMsgLoading(true);
    try {
      const res = await fetch(config.get_message, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({ ctvId, uidFrom, limit, offset: page * limit }),
      });
      if (!res.ok) {
        console.error("API lỗi:", res.status);
        setMsgHasMore((prev) => ({ ...prev, [uidFrom]: false }));
        return [];
      }
      const data = await res.json();
      const list = data[0]?.messageChats || [];
      if (list.length < limit) {
        setMsgHasMore((prev) => ({ ...prev, [uidFrom]: false }));
      }
      return list;
    } catch (err) {
      console.error("Lỗi load tin nhắn:", err);
      return [];
    } finally {
      setMsgLoading(false);
    }
  };

  // Load thêm tin nhắn khi msgPage thay đổi
  useEffect(() => {
    if (!activeChat || msgPage[activeChat] === undefined) return;
    if (msgPage[activeChat] === 0) return;

    const fetchMore = async () => {
      const list = await loadMessages(ctvId, activeChat, msgPage[activeChat]);
      const mapped = list.map((m, index) => ({
        id: m.id || `${msgPage[activeChat]}-${index}`,
        text: m.content,
        href: m.href || null,
        sender: m.is_selt === true || m.is_selt === "true" ? "me" : "other",
        time: new Date(Number(m.time)).toLocaleString("vi-VN"),
        avatar:
          m.avatar && m.avatar.trim() !== ""
            ? m.avatar
            : "https://stc-zaloprofile.zdn.vn/pc/v1/images/zalo_sharelogo.png",
        isSystemMessage: false,
      }));

      setMessages((prev) => {
        const existing = prev[activeChat] || [];
        const existingIds = new Set(existing.map((m) => m.id));

        const uniqueNew = mapped.filter((m) => !existingIds.has(m.id));

        return {
          ...prev,
          [activeChat]: [...existing, ...uniqueNew], // ✅ append xuống dưới
        };
      });
    };

    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgPage, activeChat, ctvId]);

  // Lọc danh sách hội thoại theo từ khóa tìm kiếm
  const filteredConversations = customerList
    .filter((conv) => conv && conv.id && conv.name)
    .filter((conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Mở hội thoại chat
  const openChat = async (conversation) => {
    if (!openChats.find((chat) => chat.id === conversation.id)) {
      setOpenChats((prev) => [...prev, conversation]);

      // 👇 Sau khi render xong, scroll tới popup mới
      setTimeout(() => {
        if (isMobile()) {
          scrollDialogToChat(conversation.id, true);
        } else {
          scrollDesktopToChat(conversation.id, true);
        }
      }, 80);
    }

    setActiveChat(conversation.id);
    setMsgPage((prev) => ({ ...prev, [conversation.id]: 0 }));
    setMsgHasMore((prev) => ({ ...prev, [conversation.id]: true }));

    // Trong openChat
    const uidFromToFetch = conversation.partnerId || conversation.id;
    const msgs = await getMessages(ctvId, uidFromToFetch);

    if (msgs.length < limit) {
      setMsgHasMore((prev) => ({ ...prev, [conversation.id]: false }));
    }

    // Gom ảnh có cùng thời gian (xem như gửi 1 lần)
    const grouped = [];
    let currentGroup = null;

    msgs.forEach((m, index) => {
      const isImage =
        m.href && (!m.content || m.content === "[non-text message]");
      const time = m.time;
      const sender =
        m.is_selt === true || m.is_selt === "true" ? "me" : "other";

      // nếu chưa có nhóm thì tạo luôn
      if (!currentGroup) {
        currentGroup = {
          id: m.id || `${m.time}-${index}`,
          sender,
          time,
          avatar:
            m.avatar && m.avatar.trim() !== ""
              ? m.avatar
              : "https://stc-zaloprofile.zdn.vn/pc/v1/images/zalo_sharelogo.png",
          text: !isImage ? m.content : null,
          href: isImage ? m.href : null,
          images: isImage ? [m.href] : [],
          isSystemMessage: false,
        };
        return;
      }

      // tính chênh lệch thời gian so với nhóm hiện tại (phải có currentGroup)
      const timeDiff = Math.abs(Number(time) - Number(currentGroup.time));

      if (
        isImage &&
        currentGroup.sender === sender &&
        timeDiff < 3000 // trong 3 giây thì gộp chung
      ) {
        currentGroup.images.push(m.href);
      } else {
        // đẩy nhóm cũ vào mảng
        grouped.push(currentGroup);
        // tạo nhóm mới
        currentGroup = {
          id: m.id || `${m.time}-${index}`,
          sender,
          time,
          avatar:
            m.avatar && m.avatar.trim() !== ""
              ? m.avatar
              : "https://stc-zaloprofile.zdn.vn/pc/v1/images/zalo_sharelogo.png",
          text: !isImage ? m.content : null,
          href: isImage ? m.href : null,
          images: isImage ? [m.href] : [],
          isSystemMessage: false,
        };
      }
    });

    // thêm nhóm cuối
    if (currentGroup) grouped.push(currentGroup);

    // map sang dạng hiển thị
    const mapped = grouped.map((g) => ({
      id: g.id,
      text: g.text,
      href: g.href,
      images: g.images,
      sender: g.sender,
      time: new Date(Number(g.time)).toLocaleString("vi-VN"),
      avatar: g.avatar,
      isSystemMessage: g.isSystemMessage,
    }));

    setMessages((prev) => ({
      ...prev,
      [conversation.id]: mapped, // dữ liệu đã ASC, set thẳng
    }));

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
        // 👇 Quay lại danh sách hội thoại nếu ở mobile
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

  useEffect(() => {
    if (mobileView === "chat" && activeChat) {
      // gọi nhiều lần ở các mốc nhỏ để chắc chắn DOM đã có element
      const timeouts = [0, 50, 120, 300].map((delay) =>
        setTimeout(() => {
          scrollDialogToChat(activeChat, true);
        }, delay)
      );
      return () => timeouts.forEach(clearTimeout);
    }
  }, [mobileView, activeChat, openChats]);

  useEffect(() => {
    if (!isMobile() && activeChat) {
      const timeouts = [0, 80, 150].map((delay) =>
        setTimeout(() => {
          scrollDesktopToChat(activeChat, true);
        }, delay)
      );
      return () => timeouts.forEach(clearTimeout);
    }
  }, [activeChat, openChats]);

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

            {(mobileView === "conversation" || mobileView === "chat") && (
              <div className={cx("mobile-conversation")}>
                <div className={cx("wrapper-header-mobile")}>
                  <button
                    className={cx("back-button")}
                    onClick={() => setMobileView("ctv")}
                  >
                    <ArrowBack /> Quay lại CTV
                  </button>
                  <Button onClick={() => setDrawerOpen(true)} type="button">
                    <Menu sx={{ color: "#fff", fontSize: 28 }} />
                  </Button>
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
                                {conversation.href &&
                                (!conversation.recentChat ||
                                  conversation.recentChat ===
                                    "[non-text message]")
                                  ? "[Hình ảnh]"
                                  : conversation.recentChat &&
                                    conversation.recentChat !==
                                      "[non-text message]"
                                  ? conversation.recentChat
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* loader */}
                      {hasMore && (
                        <div
                          style={{ textAlign: "center" }}
                          className={cx("loader_mobile")}
                        >
                          <button
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={isLoading}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "6px",
                              border: "1px solid #764ba2",
                              background: "#764ba2",
                              color: "#fff",
                              cursor: "pointer",
                              marginBottom: 65,
                            }}
                          >
                            {isLoading ? "Đang tải..." : "Xem thêm"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Dialog
              open={mobileView === "chat" && openChats.length > 0}
              onClose={() => setMobileView("conversation")}
              disablePortal
              fullWidth
              PaperProps={{
                sx: {
                  margin: 0,
                  marginTop: "60px", // cách header 60px
                  height: "calc(100% - 15px)",
                  borderRadius: "12px 12px 0 0",
                  overflow: "hidden",
                  width: "100%",
                },
              }}
            >
              <div
                className={cx("chat-dialog")}
                data-chat-dialog
                style={{
                  height: "100%",
                  overflowY: "auto",
                  boxSizing: "border-box",
                }}
              >
                {openChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cx("chat-window", "chat-mobile")}
                    data-chat-id={chat.id}
                  >
                    {/* Chat Header */}
                    <div className={cx("chat-header")}>
                      <div className={cx("chat-header-left")}>
                        <img src={chat.avatar} alt={chat.name} />
                        <div className={cx("chat-info")}>
                          <span className={cx("chat-name")}>{chat.name}</span>
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
                              <div
                                className={cx("message-bubble", {
                                  "image-message":
                                    message.href &&
                                    (!message.text ||
                                      message.text === "[non-text message]"),
                                })}
                              >
                                {message.images && message.images.length > 0 ? (
                                  // nhiều ảnh
                                  <div
                                    className={cx("multi-image-grid")}
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        message.images.length === 1
                                          ? "1fr"
                                          : message.images.length === 2
                                          ? "repeat(2, 1fr)"
                                          : "repeat(3, 1fr)",
                                      gap: "6px",
                                      maxWidth: "280px",
                                    }}
                                  >
                                    {message.images.map((media, idx) => {
                                      const isVideo = isVideoFile(media);
                                      return isVideo ? (
                                        <div
                                          key={idx}
                                          style={{
                                            position: "relative",
                                            width: "100%",
                                            height: "90px",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                          }}
                                          onClick={() => {
                                            setPreviewSrc(media);
                                            setPreviewOpen(true);
                                          }}
                                        >
                                          <video
                                            src={media}
                                            className={cx("chat-video")}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                              borderRadius: "8px",
                                            }}
                                            muted
                                            playsInline
                                          />

                                          {/* icon play */}
                                          <div
                                            style={{
                                              position: "absolute",
                                              top: "50%",
                                              left: "50%",
                                              transform:
                                                "translate(-50%, -50%)",
                                              background: "rgba(0,0,0,0.5)",
                                              borderRadius: "50%",
                                              width: "36px",
                                              height: "36px",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="18"
                                              height="18"
                                              viewBox="0 0 24 24"
                                              fill="white"
                                            >
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          </div>
                                        </div>
                                      ) : (
                                        <img
                                          key={idx}
                                          src={media}
                                          alt="attachment"
                                          className={cx("chat-image")}
                                          style={{
                                            width: "100%",
                                            height: "90px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                          }}
                                          onClick={() => {
                                            setPreviewSrc(media);
                                            setPreviewOpen(true);
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                ) : message.href &&
                                  (!message.text ||
                                    message.text === "[non-text message]") ? (
                                  // ảnh hoặc video đơn
                                  <>
                                    {isVideoFile(message.href) ? (
                                      <video
                                        src={message.href}
                                        className={cx("chat-video")}
                                        style={{
                                          maxWidth: "220px",
                                          maxHeight: "120px",
                                          borderRadius: "10px",
                                          display: "block",
                                          objectFit: "cover",
                                          cursor: "pointer",
                                        }}
                                      />
                                    ) : (
                                      <a
                                        href={message.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={message.href}
                                          alt="attachment"
                                          className={cx("chat-image")}
                                          style={{
                                            maxWidth: "220px",
                                            maxHeight: "120px",
                                            borderRadius: "10px",
                                            display: "block",
                                            objectFit: "cover",
                                          }}
                                        />
                                      </a>
                                    )}
                                  </>
                                ) : message.text &&
                                  message.text !== "[non-text message]" ? (
                                  message.text
                                ) : (
                                  <i>(Tin nhắn trống)</i>
                                )}
                              </div>
                            )}
                            <div className={cx("message-time")}>
                              {message.time}
                            </div>
                          </div>
                        </div>
                      ))}
                      {msgHasMore[chat.id] && (
                        <div style={{ textAlign: "center", padding: 10 }}>
                          <button
                            onClick={() =>
                              setMsgPage((prev) => ({
                                ...prev,
                                [chat.id]: (prev[chat.id] || 0) + 1,
                              }))
                            }
                            disabled={msgLoading}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              border: "1px solid #764ba2",
                              background: "#764ba2",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            {msgLoading && activeChat === chat.id
                              ? "Đang tải..."
                              : "Xem thêm"}
                          </button>
                        </div>
                      )}
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
            </Dialog>

            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)} // 👈 chỉ đóng Drawer
              PaperProps={{
                sx: {
                  top: "60px",
                  height: "calc(100% - 60px)",
                  width: "100%",
                },
              }}
            >
              <div style={{ width: "100%" }}>
                <CTVList
                  onSelect={(selected) => {
                    setDrawerOpen(false);
                    if (selected) {
                      openChat(selected); // 👈 mở hội thoại
                    }
                  }}
                />
              </div>
            </Drawer>
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSearchQuery(searchTerm); // nhấn Enter thì search ngay
                          }
                        }}
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
                                {conversation.href &&
                                (!conversation.recentChat ||
                                  conversation.recentChat ===
                                    "[non-text message]")
                                  ? "[Hình ảnh]"
                                  : conversation.recentChat &&
                                    conversation.recentChat !==
                                      "[non-text message]"
                                  ? conversation.recentChat
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {hasMore && (
                        <div style={{ textAlign: "center", padding: 10 }}>
                          <button
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={isLoading}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "6px",
                              border: "1px solid #764ba2",
                              background: "#764ba2",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            {isLoading ? "Đang tải..." : "Xem thêm"}
                          </button>
                        </div>
                      )}
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
                                  <div
                                    className={cx("message-bubble", {
                                      "image-message":
                                        message.href &&
                                        (!message.text ||
                                          message.text ===
                                            "[non-text message]"),
                                    })}
                                  >
                                    {message.images &&
                                    message.images.length > 0 ? (
                                      <div
                                        className={cx("multi-image-grid")}
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            message.images.length === 1
                                              ? "1fr"
                                              : message.images.length === 2
                                              ? "repeat(2, 1fr)"
                                              : "repeat(3, 1fr)",
                                          gap: "6px",
                                          maxWidth: "280px",
                                        }}
                                      >
                                        {message.images.map((media, idx) => {
                                          const isVideo = isVideoFile(media);
                                          return isVideo ? (
                                            <div
                                              key={idx}
                                              style={{
                                                position: "relative",
                                                width: "100%",
                                                height: "90px",
                                                borderRadius: "8px",
                                                overflow: "hidden",
                                                cursor: "pointer",
                                              }}
                                              onClick={() => {
                                                setPreviewSrc(media);
                                                setPreviewOpen(true);
                                              }}
                                            >
                                              <video
                                                src={media}
                                                className={cx("chat-video")}
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                  objectFit: "cover",
                                                  borderRadius: "8px",
                                                }}
                                                muted
                                                playsInline
                                              />

                                              {/* icon play */}
                                              <div
                                                style={{
                                                  position: "absolute",
                                                  top: "50%",
                                                  left: "50%",
                                                  transform:
                                                    "translate(-50%, -50%)",
                                                  background: "rgba(0,0,0,0.5)",
                                                  borderRadius: "50%",
                                                  width: "36px",
                                                  height: "36px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  width="18"
                                                  height="18"
                                                  viewBox="0 0 24 24"
                                                  fill="white"
                                                >
                                                  <path d="M8 5v14l11-7z" />
                                                </svg>
                                              </div>
                                            </div>
                                          ) : (
                                            <img
                                              key={idx}
                                              src={media}
                                              alt="attachment"
                                              className={cx("chat-image")}
                                              style={{
                                                width: "100%",
                                                height: "90px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                              }}
                                              onClick={() => {
                                                setPreviewSrc(media);
                                                setPreviewOpen(true);
                                              }}
                                            />
                                          );
                                        })}
                                      </div>
                                    ) : message.href &&
                                      (!message.text ||
                                        message.text ===
                                          "[non-text message]") ? (
                                      <a
                                        href={message.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={message.href}
                                          alt="attachment"
                                          className={cx("chat-image")}
                                          style={{
                                            maxWidth: "220px",
                                            maxHeight: "120px",
                                            borderRadius: "10px",
                                            display: "block",
                                            objectFit: "cover",
                                          }}
                                        />
                                      </a>
                                    ) : message.text &&
                                      message.text !== "[non-text message]" ? (
                                      message.text
                                    ) : (
                                      <i>(Tin nhắn trống)</i>
                                    )}
                                  </div>
                                )}
                                {(message.text ||
                                  message.images?.length > 0 ||
                                  message.href) && (
                                  <div className={cx("message-time")}>
                                    {message.time}
                                  </div>
                                )}
                              </div>
                              {message.sender === "me" && (
                                <div className={cx("message-status")}>
                                  <i className="fas fa-check"></i>
                                </div>
                              )}
                            </div>
                          ))}
                          {msgHasMore[chat.id] && (
                            <div style={{ textAlign: "center", padding: 10 }}>
                              <button
                                onClick={() =>
                                  setMsgPage((prev) => ({
                                    ...prev,
                                    [chat.id]: (prev[chat.id] || 0) + 1,
                                  }))
                                }
                                disabled={msgLoading}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "6px",
                                  border: "1px solid #764ba2",
                                  background: "#764ba2",
                                  color: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                {msgLoading && activeChat === chat.id
                                  ? "Đang tải..."
                                  : "Xem thêm"}
                              </button>
                            </div>
                          )}
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

        {/* preview img/video dialog */}
      </div>
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.92)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          },
        }}
      >
        {/* Nút X đóng */}
        <Button
          onClick={() => setPreviewOpen(false)}
          sx={{
            position: "absolute",
            top: 70,
            right: 10,
            minWidth: "auto",
            padding: "6px",
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            borderRadius: "50%",
            "&:hover": { background: "rgba(255,255,255,0.2)" },
            zIndex: 99999999,
          }}
        >
          <Close
            sx={{
              fontSize: 20,
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              background: "red",
              zIndex: 99999999,
            }}
          />
        </Button>

        {/* Hiển thị ảnh hoặc video */}
        {previewSrc &&
          (isVideoFile(previewSrc) ? (
            <video
              src={previewSrc}
              controls
              autoPlay
              style={{
                width: "100%",
                maxWidth: "800px",
                height: "80%",
                borderRadius: "12px",
              }}
            />
          ) : (
            <img
              src={previewSrc}
              alt="preview"
              style={{
                width: "100%",
                maxWidth: "800px",
                height: "80%",
                borderRadius: "12px",
              }}
            />
          ))}
      </Dialog>
    </>
  );
}

export default ChatManager;
