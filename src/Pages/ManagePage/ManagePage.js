import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Button,
  TextField,
  DialogActions,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  IconButton,
  Menu,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
} from "@mui/material";
import {
  Chat,
  GroupAdd,
  Groups,
  Forum,
  Add,
  Save,
  Close,
  InfoOutlined,
  Dehaze,
} from "@mui/icons-material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import classNames from "classnames/bind";

import styles from "./ManagePage.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/system";

const cx = classNames.bind(styles);
const urlGetInfoConfig = "https://wf.mkt04.vawayai.com/webhook/get_info_msg";
const urlUpdateConfig = "https://wf.mkt04.vawayai.com/webhook/update_config";
const urlDeleteConfig = "https://wf.mkt04.vawayai.com/webhook/delete_config";

function ManagePage() {
  const [stats, setStats] = useState({
    total_ctv: 0,
    total_customers: 0,
    chats_today: 0,
    chats_last_7d: 0,
    chats_this_month: 0,
    total_unreplied: 0,
    total_replied: 0,
  });
  const navigate = useNavigate();
  const [fetchLoading] = useState(false);
  const [error] = useState("");
  const wrapperRef = useRef();
  const headerRef = useRef();
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogData, setDialogData] = useState([]);
  const [ctvData, setCtvData] = useState([]);
  const [unrepliedDetail, setUnrepliedDetail] = useState([]);
  const [todayChats, setTodayChats] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  // Responsive + mobile menu
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const paginatedData = dialogData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(urlGetInfoConfig, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });

        // ✅ nếu token hết hạn hoặc bị chặn
        if (res.status === 401 || res.status === 403) {
          setSnackbar({
            open: true,
            message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
            severity: "error",
          });
          localStorage.removeItem("token");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Phản hồi không hợp lệ:", text);
          return;
        }

        if (Array.isArray(data)) {
          setConfigs(data);
          if (data.length > 0) handleSelectConfig(data[0]);
        } else if (data.configs) {
          setConfigs(data.configs);
          if (data.configs.length > 0) handleSelectConfig(data.configs[0]);
        }
      } catch (err) {
        console.error("Lỗi khi load configs:", err);
      }
    };
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tách riêng logic chọn config để tái sử dụng
  const handleSelectConfig = (chosen) => {
    setSelectedConfig(chosen);

    if (chosen?.get_ctv) {
      fetch(chosen.get_ctv, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({ action: "get_ctv_list" }),
      })
        .then((res) => res.json())
        .then((data) => {
          const result = data[0]?.result;
          if (!result) return;

          const stats = result.stats;
          const monthly = result.monthly_stats;

          if (stats) {
            setStats({
              total_ctv: stats.total_ctv || 0,
              total_customers: stats.total_customers || 0,
              chats_today: stats.chats_today || 0,
              chats_last_7d: stats.chats_last_7d || 0,
              chats_this_month: stats.chats_this_month || 0,
              total_unreplied: stats.total_unreplied || 0,
              total_replied: stats.total_replied || 0,
            });
          }

          if (Array.isArray(monthly)) {
            setMonthlyStats(monthly);
          }

          // ⚡ Lưu thêm vào state
          setCtvData(result.ctvData || []);
          setUnrepliedDetail(result.unreplied_detail || []);
          setTodayChats(result.today_chats || []);
        })
        .catch((err) => console.error("Lỗi khi load CTV:", err));
    }
  };

  useEffect(() => {
    const resizeHeader = () => {
      if (wrapperRef.current && headerRef.current) {
        const wrapper = wrapperRef.current;
        const header = headerRef.current;
        header.style.width = `${wrapper.offsetWidth}px`;
        header.style.left = `${wrapper.getBoundingClientRect().left}px`;
      }
    };
    resizeHeader();
    window.addEventListener("resize", resizeHeader);
    return () => window.removeEventListener("resize", resizeHeader);
  }, []);

  const handleSave = async () => {
    if (!selectedConfig) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlUpdateConfig, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedConfig),
      });

      // ⚠️ Check token hết hạn hoặc không hợp lệ
      if (res.status === 401 || res.status === 403) {
        setSnackbar({
          open: true,
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
          severity: "error",
        });
        localStorage.removeItem("token");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setConfigs((prev) =>
          prev.map((cfg) =>
            cfg.id === selectedConfig.id ? selectedConfig : cfg
          )
        );
        setSnackbar({
          open: true,
          message: "Cập nhật thành công",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Cập nhật thất bại",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi lưu config.",
        severity: "error",
      });
    }
  };

  const handleDeleteConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlDeleteConfig, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteId }),
      });

      // ⚠️ Check token hết hạn hoặc không hợp lệ
      if (res.status === 401 || res.status === 403) {
        setSnackbar({
          open: true,
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
          severity: "error",
        });
        localStorage.removeItem("token");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setConfigs((prev) => prev.filter((cfg) => cfg.id !== deleteId));

        // ✅ reset selectedConfig nếu nó là config vừa xoá
        if (selectedConfig?.id === deleteId) {
          setSelectedConfig(null);
        }

        setSnackbar({
          open: true,
          message: "Xóa config thành công",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Xóa config thất bại",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi xóa config.",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handlePushId = () => {
    if (!selectedConfig) return;
    navigate(`/chat/${selectedConfig.id}`);
    console.log("đi tới trang chat với id:", selectedConfig.id);
  };

  const chartData = monthlyStats.map((item) => ({
    name: item.month, // nhãn trục X
    value: item.total_chats, // dữ liệu biểu đồ
  }));

  const handleOpenDialog = (type) => {
    if (type === "total_ctv") {
      setDialogTitle("Danh sách Cộng tác viên");
      setDialogData(ctvData);
    } else if (type === "unreplied") {
      setDialogTitle("Danh sách hội thoại chưa rep");
      setDialogData(unrepliedDetail);
    } else if (type === "today") {
      setDialogTitle("Danh sách hội thoại hôm nay");
      setDialogData(todayChats);
    }
    setOpenDialog(true);
  };

  const formatTime = (ts) => {
    if (!ts) return "--";
    const date = new Date(Number(ts));
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={cx("wrapper")} ref={wrapperRef}>
      {/* Header responsive: title left, controls collapse into menu on mobile */}
      <Box
        className={cx("title_header")}
        ref={headerRef}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          px: 0,
        }}
      >
        {/* Title luôn hiện */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            fontSize: isMobile ? "18px" : "20px",
            color: "white",
            ml: 2,
          }}
        >
          Tổng quan
        </Typography>

        {/* If mobile: show single ICON button that opens menu.
      If not mobile: show full controls (original layout). */}
        {isMobile ? (
          <>
            <IconButton
              aria-label="menu"
              aria-controls={openMenu ? "header-menu" : undefined}
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ color: "white" }}
            >
              <Dehaze />
            </IconButton>

            <Menu
              id="header-menu"
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
              PaperProps={{
                sx: {
                  width: "100vw", // full width
                  maxWidth: "100vw",
                  left: "0 !important", // ép nó dính sát trái
                  right: "0 !important", // ép nó dính sát phải
                },
              }}
            >
              {/* 1) Select (project) */}
              <MenuItem disableRipple sx={{ px: 2, py: 1.5 }}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel sx={{ fontSize: 13 }}>Name Project</InputLabel>
                  <Select
                    value={selectedConfig?.id || ""}
                    onChange={(e) => {
                      const chosen = configs.find(
                        (c) => c.id === e.target.value
                      );
                      if (chosen) handleSelectConfig(chosen);
                      handleMenuClose();
                    }}
                    displayEmpty
                  >
                    {configs.map((cfg) => (
                      <MenuItem key={cfg.id} value={cfg.id}>
                        {cfg.name_project}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </MenuItem>

              {/* 2) Add config */}
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  window.location.href = "/add-config";
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    borderColor: "black", // viền đen
                    color: "black", // chữ đen
                    "&:hover": {
                      borderColor: "black",
                      backgroundColor: "rgba(0,0,0,0.1)", // hover có nền xám nhẹ
                    },
                  }}
                >
                  + Thêm Config
                </Button>
              </MenuItem>

              {/* 3) Save */}
              <MenuItem
                onClick={() => {
                  handleSave();
                  handleMenuClose();
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    backgroundColor: "black", // nền đen
                    color: "white", // chữ trắng
                    "&:hover": {
                      backgroundColor: "#333", // hover đen nhạt hơn
                    },
                  }}
                >
                  💾 Lưu cấu hình
                </Button>
              </MenuItem>
            </Menu>
          </>
        ) : (
          // Desktop: giữ layout hiện tại (select + 2 nút ngang)
          <Box display="flex" gap={2} alignItems="center">
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel
                sx={{
                  fontSize: "14px",
                  color: "var(--layer_background)!important",
                }}
              >
                Name Project
              </InputLabel>
              <Select
                value={selectedConfig?.id || ""}
                onChange={(e) => {
                  const chosen = configs.find((c) => c.id === e.target.value);
                  if (chosen) handleSelectConfig(chosen);
                }}
                renderValue={(selectedId) => {
                  const chosen = configs.find((c) => c.id === selectedId);
                  return chosen ? chosen.name_project : "";
                }}
                sx={{
                  fontSize: "14px",
                  color: "var(--layer_background)",
                  "& .MuiSelect-select": { py: 1.5 },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                  maxWidth: "100%",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--layer_background) !important",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--layer_background)",
                  },
                  "& .MuiSelect-icon": {
                    color: "var(--layer_background)",
                    right: "-2px",
                  },
                }}
              >
                {configs.map((cfg) => (
                  <MenuItem
                    key={cfg.id}
                    value={cfg.id}
                    sx={{
                      fontSize: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{cfg.name_project}</span>
                    <Close
                      sx={{ fontSize: 18, color: "red", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(cfg.id);
                        setConfirmOpen(true);
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              component={Link}
              size="small"
              startIcon={<Add />}
              sx={{
                color: "white !important",
                borderColor: "rgba(255, 255, 255, 0.5)",
                textTransform: "capitalize",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
              to="/add-config"
            >
              Thêm config
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              Lưu cấu hình
            </Button>
          </Box>
        )}
      </Box>

      <Box p={4} mt={7}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: "14px" }}>
            {error}
          </Alert>
        )}
        {fetchLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
            }}
          >
            <CircularProgress sx={{ color: "#0F172A" }} />
          </Box>
        ) : (
          <>
            {configs.length === 0 ? (
              <Typography align="center" sx={{ mt: 5, color: "white" }}>
                Bạn chưa có dự án nào. Hãy{" "}
                <Button
                  component={Link}
                  to="/add-config"
                  variant="outlined"
                  size="small"
                  sx={{
                    ml: 1,
                    mr: 1,
                    textTransform: "none",
                    color: "white", // màu chữ
                    borderColor: "white", // outline trắng
                    "&:hover": {
                      borderColor: "white", // giữ outline trắng khi hover
                      backgroundColor: "rgba(255,255,255,0.1)", // hover nhẹ
                    },
                  }}
                >
                  Thêm config
                </Button>
                để bắt đầu.
              </Typography>
            ) : selectedConfig ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Biểu đồ tăng trưởng truy cập */}
                  {/* <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  > */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography fontWeight="bold" fontSize={16} mb={2}>
                        Tổng số hội thoại trong từng tháng
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#0abfbc"
                            strokeWidth={2}
                          />
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="name" style={{ fontSize: 14 }} />
                          <YAxis style={{ fontSize: 14 }} />
                          <Tooltip contentStyle={{ fontSize: 14 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>

                    <Grid xs={12} md={6} item sx={{ mt: 3 }}>
                      <Grid container spacing={2}>
                        {[
                          {
                            title: "Tổng khách hàng",
                            value: stats.total_customers,
                            icon: (
                              <Groups
                                sx={{ color: "green", fontSize: 20, mr: 1 }}
                              />
                            ),
                            color: "green",
                          },
                          {
                            title: "Cuộc Trò Chuyện",
                            value: (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box>
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      marginTop: "8px",
                                    }}
                                  >
                                    Đã trả lời
                                  </p>
                                  <Typography fontSize={36} mr={2}>
                                    {stats.total_replied}
                                  </Typography>
                                </Box>
                                <Box>
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      marginTop: "8px",
                                    }}
                                  >
                                    Đã bỏ lỡ
                                  </p>
                                  <Typography fontSize={36}>
                                    {stats.total_unreplied}
                                  </Typography>
                                </Box>
                              </Box>
                            ),
                            icon: (
                              <Chat
                                sx={{ color: "#D81B60", fontSize: 20, mr: 1 }}
                              />
                            ),
                            color: "#D81B60",
                          },
                          {
                            title: "Tổng cộng tác viên",
                            value: stats.total_ctv,

                            icon: (
                              <GroupAdd
                                sx={{ color: "#F44336", fontSize: 20, mr: 1 }}
                              />
                            ),
                            color: "#F44336",
                          },
                          {
                            title: "Tổng cuộc chat",
                            value: (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box
                                  sx={{
                                    marginRight: "10px",
                                    textAlign: "center",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      marginTop: "8px",
                                    }}
                                  >
                                    Hôm nay
                                  </p>
                                  <Typography fontSize={36} mr={2}>
                                    {stats.chats_today}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    marginRight: "10px",
                                    textAlign: "center",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      marginTop: "8px",
                                    }}
                                  >
                                    7 ngày qua
                                  </p>
                                  <Typography fontSize={36}>
                                    {stats.chats_last_7d}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    marginRight: "10px",
                                    textAlign: "center",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      marginTop: "8px",
                                    }}
                                  >
                                    1 tháng qua
                                  </p>
                                  <Typography fontSize={36}>
                                    {stats.chats_this_month}
                                  </Typography>
                                </Box>
                              </Box>
                            ),
                            icon: (
                              <Forum
                                sx={{ color: "#D81B60", fontSize: 20, mr: 1 }}
                              />
                            ),
                            color: "#D81B60",
                          },
                        ].map((item, idx) => (
                          <Grid item xs={12} sm={6} key={idx}>
                            <Paper
                              elevation={2}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                height: "100%",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                if (item.title === "Tổng cộng tác viên") {
                                  handleOpenDialog("total_ctv");
                                } else if (item.title === "Cuộc Trò Chuyện") {
                                  handleOpenDialog("unreplied");
                                } else if (item.title === "Tổng cuộc chat") {
                                  handleOpenDialog("today");
                                }
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box>
                                  <Typography
                                    fontWeight="bold"
                                    fontSize={16}
                                    sx={{
                                      color: "var(--c_letter)",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {item.icon} {item.title}
                                  </Typography>
                                  <Box
                                    sx={{
                                      fontSize: 36,
                                      fontWeight: "bold",
                                      marginLeft: "20px",
                                    }}
                                  >
                                    {item.title !== "Cuộc Trò Chuyện" && (
                                      <p
                                        style={{
                                          color: "var(--c_letter)",
                                          fontSize: 12,
                                          marginTop: "10px",
                                          marginBottom: "10px",
                                        }}
                                      ></p>
                                    )}
                                    {item.value}
                                  </Box>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography align="center" sx={{ mt: 5, color: "#fff" }}>
                Vui lòng chọn một dự án để xem thống kê và cấu hình webhook
              </Typography>
            )}
          </>
        )}
        {selectedConfig && (
          <Box
            sx={{
              backgroundColor: "#f5f5f5",
              p: 2,
              borderRadius: 2,
              mb: 3,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#020202b4" }}
              >
                Cấu hình Webhook cho dự án
              </Typography>
              <p style={{ width: "100%", textAlign: "right" }}>
                <Button>
                  <Typography
                    component={"a"}
                    variant="outlined"
                    onClick={handlePushId}
                    sx={{
                      fontWeight: 600,
                      color: "#333 !important",
                      fontSize: 20,
                      textTransform: "none",
                      float: "right",
                    }}
                  >
                    Vào trang quản lý chat 👉
                  </Typography>
                </Button>
              </p>
            </Box>
            <Box sx={{ marginLeft: 2 }}>
              {/* Webhook CTV */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
                <GroupAdd sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: 18, mr: 1 }}
                >
                  Webhook các CTV
                </Typography>
                <Tooltip
                  title="Webhook này được dùng để lấy danh sách cộng tác viên của dự án"
                  arrow
                  placement="right"
                >
                  <InfoOutlined
                    sx={{ fontSize: 18, color: "#999", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>

              <TextField
                fullWidth
                size="small"
                value={selectedConfig.get_ctv || ""}
                onChange={(e) =>
                  setSelectedConfig({
                    ...selectedConfig,
                    get_ctv: e.target.value,
                  })
                }
              />

              {/* Webhook hội thoại */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
                <Chat sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: 18, marginRight: "10px" }}
                >
                  Webhook các hội thoại
                </Typography>
                <Tooltip
                  title="Webhook này được dùng để lấy danh sách hội thoại của khách hàng"
                  arrow
                  placement="right"
                >
                  <InfoOutlined
                    sx={{ fontSize: 18, color: "#999", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                size="small"
                value={selectedConfig.get_chat || ""}
                onChange={(e) =>
                  setSelectedConfig({
                    ...selectedConfig,
                    get_chat: e.target.value,
                  })
                }
              />

              {/* Webhook message */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
                <Forum sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: 18, marginRight: "10px" }}
                >
                  Webhook các message
                </Typography>
                <Tooltip
                  title="Webhook này được dùng để lấy danh sách tin nhắn trong hội thoại"
                  arrow
                  placement="right"
                >
                  <InfoOutlined
                    sx={{ fontSize: 18, color: "#999", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                size="small"
                value={selectedConfig.get_message || ""}
                onChange={(e) =>
                  setSelectedConfig({
                    ...selectedConfig,
                    get_message: e.target.value,
                  })
                }
              />
            </Box>
          </Box>
        )}
      </Box>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "77vh", // chiếm 80% màn hình
          }}
        >
          <DialogContent dividers>
            {dialogTitle === "Danh sách Cộng tác viên" && (
              <Table
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <TableHead
                  sx={{
                    background: "var(--c_header_table)",
                    "& .MuiTableCell-head": {
                      fontWeight: 600, // chữ đậm
                      color: "#374151", // màu chữ tối
                    },
                  }}
                >
                  <TableRow >
                    <TableCell>STT</TableCell>
                    <TableCell>Ảnh đại diện</TableCell>
                    <TableCell>Tên CTV</TableCell>
                    {/* <TableCell>Nội dung gần nhất</TableCell>
                    <TableCell>Thời gian</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    "& .MuiTableCell-root": {
                      color: "#4b5563", // màu chữ body
                      borderBottom: "1px solid #e5e7eb", // đường kẻ mảnh
                    },
                    "& .MuiTableRow-root:hover": {
                      backgroundColor: "#f3f4f6", // hover nhạt
                    },
                  }}
                >
                  {paginatedData.map((ctv, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Avatar src={ctv.avatar} alt={ctv.name} />
                      </TableCell>
                      <TableCell>{ctv.name}</TableCell>
                      {/* <TableCell>{ctv.recentChat || "--"}</TableCell>
                      <TableCell>{formatTime(ctv.time)}</TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {dialogTitle === "Danh sách hội thoại chưa rep" && (
              <Table
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <TableHead
                  sx={{
                    background: "var(--c_header_table)",
                    "& .MuiTableCell-head": {
                      fontWeight: 600, // chữ đậm
                      color: "#374151", // màu chữ tối
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Tên CTV</TableCell>
                    <TableCell>Tên khách hàng</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell>Thời gian</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    "& .MuiTableCell-root": {
                      color: "#4b5563", // màu chữ body
                      borderBottom: "1px solid #e5e7eb", // đường kẻ mảnh
                    },
                    "& .MuiTableRow-root:hover": {
                      backgroundColor: "#f3f4f6", // hover nhạt
                    },
                  }}
                >
                  {paginatedData.map((chat, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{chat.ctv_name}</TableCell>
                      <TableCell>{chat.customer_name}</TableCell>
                      <TableCell>{chat.recentChat || "--"}</TableCell>
                      <TableCell>{formatTime(chat.time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {dialogTitle === "Danh sách hội thoại hôm nay" && (
              <Table
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <TableHead
                  sx={{
                    background: "var(--c_header_table)",
                    "& .MuiTableCell-head": {
                      fontWeight: 600, // chữ đậm
                      color: "#374151", // màu chữ tối
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Tên CTV</TableCell>
                    <TableCell>Tên khách hàng</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell>Thời gian</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    "& .MuiTableCell-root": {
                      color: "#4b5563", // màu chữ body
                      borderBottom: "1px solid #e5e7eb", // đường kẻ mảnh
                    },
                    "& .MuiTableRow-root:hover": {
                      backgroundColor: "#f3f4f6", // hover nhạt
                    },
                  }}
                >
                  {paginatedData.map((chat, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{chat.ctv_name}</TableCell>
                      <TableCell>{chat.customer_name}</TableCell>
                      <TableCell>{chat.recentChat || "--"}</TableCell>
                      <TableCell>{formatTime(chat.time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              px: 1,
            }}
          >
            <Typography fontSize={14} color="text.secondary">
              Showing{" "}
              {Math.min(rowsPerPage, dialogData.length - page * rowsPerPage)} of{" "}
              {dialogData.length}
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
                sx={{ textTransform: "none" }}
              >
                Prev
              </Button>

              {Array.from({
                length: Math.ceil(dialogData.length / rowsPerPage),
              }).map((_, i) => (
                <Button
                  key={i}
                  size="small"
                  variant={i === page ? "contained" : "outlined"}
                  onClick={() => setPage(i)}
                  sx={{
                    minWidth: 32,
                    p: "2px 8px",
                    textTransform: "none",
                  }}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                size="small"
                disabled={
                  page >= Math.ceil(dialogData.length / rowsPerPage) - 1
                }
                onClick={() => setPage((prev) => prev + 1)}
                sx={{ textTransform: "none" }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        <DialogActions>
          <Button
          variant="contained"
            onClick={() => setOpenDialog(false)}
            sx={{ textTransform: "none", background: "var(--b_liner)" }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", fontSize: 13 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xoá</DialogTitle>
        <DialogContent sx={{ fontSize: 20, ml: 3 }}>
          Bạn có chắc chắn muốn xoá config này?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleDeleteConfig}
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ManagePage;
