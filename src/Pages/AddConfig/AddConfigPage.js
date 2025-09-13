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
import { Save, Chat, Group, QuestionAnswer, Create } from "@mui/icons-material";
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

      // ⚠️ Check hết token
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
        // điều hướng sau khi hiển thị thông báo thành công
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

  return (
    <div className={cx("wrapper")}>
      <Container>
        <Box className={cx("title_header")}>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textTransform: "capitalize",
              fontWeight: 600,
            }}
          >
            Thêm cấu hình webhook
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                textTransform: "capitalize",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              Lưu cấu hình
            </Button>
          </Box>
        </Box>

        <Box
          p={4}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            marginLeft: "2px",
            marginRight: "2px",
            height: "100%",
            borderRadius: "8px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box>
            {/* name project */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
              <Create sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#333", fontSize: 18 }}
              >
                Tên dự án
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              name="name_project"
              value={form.name_project}
              onChange={handleChange}
              placeholder="Tên dự án"
            />

            {/* Webhook CTV */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
              <Group sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#333", fontSize: 18 }}
              >
                Webhook các CTV
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
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
            />

            {/* Webhook hội thoại */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
              <Chat sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#333", fontSize: 18 }}
              >
                Webhook các hội thoại
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
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
            />

            {/* Webhook message */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
              <QuestionAnswer sx={{ mr: 1, fontSize: 28, color: "#667eea" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#333", fontSize: 18 }}
              >
                Webhook các message
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
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
            />
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
          sx={{ width: "100%", fontSize: 13 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default AddConfigPage;
