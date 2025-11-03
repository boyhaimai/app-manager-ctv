import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Save,
  PeopleAlt,
  Chat,
  QuestionAnswer,
  Create,
  InfoOutlined,
  EditOutlined,
  CalendarTodayOutlined,
  MailOutline,
  ArrowBack, // Thêm icon ArrowBack
} from "@mui/icons-material";
import classNames from "classnames/bind";
import styles from "./AddConfigPage.module.scss";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);
const apiConfig = "https://wf.mkt04.vawayai.com/webhook/add_config_msg";

function AddConfigPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name_project: "",
    get_ctv: "",
    get_chat: "",
    get_message: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const token = localStorage.getItem("token");
  const webhookPattern = /^https:\/\/[^ ]+\/webhook\/.+$/;
  const isValidWebhook = (url) => webhookPattern.test(url);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (
      !isValidWebhook(form.get_ctv) ||
      !isValidWebhook(form.get_chat) ||
      !isValidWebhook(form.get_message)
    ) {
      setSnackbar({
        open: true,
        message: "Webhook phải có dạng https://.../webhook/...",
        severity: "error",
      });
      return;
    }

    try {
      const res = await fetch(apiConfig, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(form),
      });

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
      } catch (e) {
        setSnackbar({
          open: true,
          message: "Phản hồi không hợp lệ từ server.",
          severity: "error",
        });
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result.success === false || result.config_exists) {
        setSnackbar({
          open: true,
          message: result.message || "Config đã tồn tại",
          severity: "warning",
        });
        return;
      }

      if (result.success === true) {
        setSnackbar({
          open: true,
          message: result.message || "Config đã thêm thành công",
          severity: "success",
        });
        setTimeout(() => navigate("/manager-page"), 1200);
      }
    } catch (err) {
      console.error("Lỗi:", err);
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi lưu config.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderIcon = (IconComponent, color) => (
    <IconComponent sx={{ mr: 1.5, fontSize: 20, color: color }} />
  );

  return (
    <div className={cx("wrapper")}>
      <Container className={cx("form_container")}>
        <Box className={cx("title_header")}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 600,
              }}
            >
              Thêm Cấu Hình Webhook
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/manager-page")}
              sx={{
                borderColor: "rgba(255, 255, 255, 0.5)",
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderColor: "white",
                },
              }}
            >
              Quay lại
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                backgroundColor: "white",
                color: "#667eea",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#f0f0f0",
                },
              }}
            >
              Lưu Cấu Hình
            </Button>
          </Box>
        </Box>

        <Box className={cx("form_box")}>
          {/* name project */}
          <Box className={cx("input_group")}>
            <Box className={cx("input_label_box")}>
              {renderIcon(EditOutlined, "#667eea")}
              <Typography variant="h6" className={cx("input_label_text")}>
                Tên dự án
              </Typography>
            </Box>
            <TextField
              fullWidth
              name="name_project"
              value={form.name_project}
              onChange={handleChange}
              placeholder="Tên dự án"
              size="medium"
              className={cx("text_field")}
              sx={{
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "16px", // 👈 cỡ chữ placeholder
                  opacity: 0.8, // tuỳ bạn
                  color: "#aaa", // tuỳ bạn
                },
              }}
            />
          </Box>

          {/* Webhook CTV */}
          <Box className={cx("input_group")}>
            <Box className={cx("input_label_box")}>
              {renderIcon(PeopleAlt, "#9c27b0")}
              <Typography variant="h6" className={cx("input_label_text")}>
                Webhook các CTV
              </Typography>
            </Box>
            <TextField
              fullWidth
              name="get_ctv"
              value={form.get_ctv}
              onChange={handleChange}
              placeholder="https://example.com/webhook"
              error={form.get_ctv && !isValidWebhook(form.get_ctv)}
              helperText={
                form.get_ctv && !isValidWebhook(form.get_ctv)
                  ? "Webhook phải có dạng https://.../webhook/..."
                  : ""
              }
              className={cx("text_field")}
              size="medium"
              sx={{
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "16px", // 👈 cỡ chữ placeholder
                  opacity: 0.8, // tuỳ bạn
                  color: "#aaa", // tuỳ bạn
                },
              }}
            />
          </Box>

          {/* Webhook hội thoại */}
          <Box className={cx("input_group")}>
            <Box className={cx("input_label_box")}>
              {renderIcon(CalendarTodayOutlined, "#4caf50")}
              <Typography variant="h6" className={cx("input_label_text")}>
                Webhook các hội thoại
              </Typography>
            </Box>
            <TextField
              fullWidth
              name="get_chat"
              value={form.get_chat}
              onChange={handleChange}
              placeholder="https://example.com/webhook"
              error={form.get_chat && !isValidWebhook(form.get_chat)}
              helperText={
                form.get_chat && !isValidWebhook(form.get_chat)
                  ? "Webhook phải có dạng https://.../webhook/..."
                  : ""
              }
              className={cx("text_field")}
              size="medium"
              sx={{
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "16px", // 👈 cỡ chữ placeholder
                  opacity: 0.8, // tuỳ bạn
                  color: "#aaa", // tuỳ bạn
                },
              }}
            />
          </Box>

          {/* Webhook message */}
          <Box className={cx("input_group")}>
            <Box className={cx("input_label_box")}>
              {renderIcon(MailOutline, "#ff9800")}
              <Typography variant="h6" className={cx("input_label_text")}>
                Webhook các message
              </Typography>
            </Box>
            <TextField
              fullWidth
              name="get_message"
              value={form.get_message}
              onChange={handleChange}
              placeholder="https://example.com/webhook"
              error={form.get_message && !isValidWebhook(form.get_message)}
              helperText={
                form.get_message && !isValidWebhook(form.get_message)
                  ? "Webhook phải có dạng https://.../webhook/..."
                  : ""
              }
              className={cx("text_field")}
              size="medium"
              sx={{
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "16px", // 👈 cỡ chữ placeholder
                  opacity: 0.8, // tuỳ bạn
                  color: "#aaa", // tuỳ bạn
                },
              }}
            />
          </Box>

          {/* Thông tin quan trọng */}
          <Box className={cx("info_box")}>
            <Box className={cx("info_title_box")}>
              {renderIcon(InfoOutlined, "#1890ff")}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 17 }}>
                Thông tin quan trọng
              </Typography>
            </Box>
            <Typography className={cx("info_content")} sx={{ fontSize: 14 }}>
              Webhook URL sẽ được sử dụng để gửi thông báo khi có sự kiện xảy
              ra. Đảm bảo URL có thể truy cập được và hỗ trợ phương thức POST.
            </Typography>
          </Box>
        </Box>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", fontSize: 14 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default AddConfigPage;
