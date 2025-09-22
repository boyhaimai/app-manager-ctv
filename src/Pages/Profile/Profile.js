import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import styles from "./Profile.module.scss";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const cx = classNames.bind(styles);
const urlChangePassword = "https://wf.mkt04.vawayai.com/webhook/change_pass";

const urlGetInfo = "https://wf.mkt04.vawayai.com/webhook/get_account_msg";
const urlUpdateName =
  "https://wf.mkt04.vawayai.com/webhook/update_name_account";

const inputStyle = {
  "& .MuiInputBase-root": {
    backgroundColor: "#f7f8fa",
    fontSize: 13,
  },
  "& .MuiInputBase-input": {
    fontSize: 13,
    color: "#1e1e1e",
  },
  "& .MuiInputLabel-root": {
    fontSize: 13,
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#e0e0e0" },
    "&:hover fieldset": { borderColor: "#0F172A" },
    "&.Mui-focused fieldset": { borderColor: "#0F172A" },
  },
  "& .MuiFormHelperText-root": {
    fontSize: 12,
    marginTop: "4px",
    backgroundColor: "transparent",
  },
};

function Profile() {
  const wrapperRef = useRef();
  const headerRef = useRef(null);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [adminInfo, setAdminInfo] = useState({
    name: "",
    phoneNumber: "", // Thêm phoneNumber
  });
  const [errors, setErrors] = useState({});
  const [avatarError, setAvatarError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(urlGetInfo, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // ⚠️ Kiểm tra token hết hạn ngay sau khi gọi fetch
        if (res.status === 401 || res.status === 403) {
          setSnackbar({
            open: true,
            message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
            severity: "error",
          });
          localStorage.removeItem("token");
          setTimeout(() => (window.location.href = "/"), 2000);
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

        const result = Array.isArray(data) ? data[0] : data;
        if (result) {
          setAdminInfo({
            name: result.name_customer || "",
            phoneNumber: result.phone || "",
          });
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin account:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountInfo();
  }, []);

  const handleUpdateName = async () => {
    if (!adminInfo.name.trim()) {
      setErrors({ name: "Tên không được để trống" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlUpdateName, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: adminInfo.name }),
      });

      // ⚠️ Check hết token
      if (res.status === 401 || res.status === 403) {
        setSnackbar({
          open: true,
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
          severity: "error",
        });
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "/"), 2000);
        return;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setSnackbar({
          open: true,
          message: "Phản hồi không hợp lệ: " + text,
          severity: "error",
        });
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (result && result.name_customer) {
        setAdminInfo({
          name: result.name_customer,
          phoneNumber: result.phone,
        });
        setSnackbar({
          open: true,
          message: "Cập nhật tên thành công",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Cập nhật tên thất bại",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Lỗi cập nhật tên:", err);
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi cập nhật tên",
        severity: "error",
      });
    }
  };

  // Kiểm tra URL ảnh hợp lệ
  const isValidImageUrl = (url) => {
    if (!url) return true; // Allow empty URL
    const imageExtensions = /\.(jpeg|jpg|png|gif|webp)/i;
    try {
      new URL(url);
      return imageExtensions.test(url);
    } catch {
      return false;
    }
  };

  const handleOpenChangePassword = () => setOpenChangePassword(true);
  const handleCloseChangePassword = () => {
    setOpenChangePassword(false);
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setErrors({ confirmPassword: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrors({ confirmPassword: "Mật khẩu xác nhận không khớp" });
      return;
    }

    if (form.newPassword.length < 6) {
      setErrors({ newPassword: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlChangePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      // ⚠️ Check hết token
      if (res.status === 401 || res.status === 403) {
        setSnackbar({
          open: true,
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
          severity: "error",
        });
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "/"), 2000);
        return;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setSnackbar({
          open: true,
          message: "Phản hồi không hợp lệ: " + text,
          severity: "error",
        });
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (result.success) {
        setSnackbar({
          open: true,
          message:
            result.message ||
            "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
          severity: "success",
        });
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "/"), 2000);
      } else {
        setSnackbar({
          open: true,
          message: result.message || "Đổi mật khẩu thất bại",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Lỗi:", err);
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi đổi mật khẩu",
        severity: "error",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setAdminInfo({ ...adminInfo, name: value });
      setErrors({ ...errors, name: "" });
    } else if (name === "avatar") {
      setAdminInfo({ ...adminInfo, avatar: value });
      setAvatarError("");
      if (value && !isValidImageUrl(value)) {
        setAvatarError(
          "URL không phải là link ảnh hợp lệ (jpg, png, gif, webp)."
        );
      }
    } else {
      setForm({ ...form, [name]: value });
      setErrors({ ...errors, [name]: "" });
    }
  };

  // handleAvatarChange function is removed since local file uploads are no longer supported

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

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className={cx("wrapper")} ref={wrapperRef}>
      <Box
        className={cx("title_header")}
        ref={headerRef}
        sx={{
          bgcolor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: "8px",
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
          Thông tin hồ sơ
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: "var(--c_white)",
            color: "var(--c_letter)",
            fontSize: 13,
            textTransform: "none",
            px: 3,
            py: 1,
            "&:hover": { bgcolor: "#1e293b", color: "#fff" },
            borderRadius: "8px",
            fontWeight: "bold",
          }}
          disabled={!!avatarError}
          onClick={handleUpdateName} // 👈 Thêm chỗ này
        >
          Lưu
        </Button>
      </Box>

      <Box
        p={{ xs: 2, md: 4 }}
        mt={1}
        sx={{
          bgcolor: "#fff",
          height: "calc(100vh - 3px)",
          marginLeft: "3px",
          marginRight: "3px",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: "bold", mb: 3 }}>
          Thông tin cơ bản
        </Typography>
        <Grid container>
          <Grid item xs={12} width={"100%"}>
            <Box
              sx={{
                alignItems: "center",
                gap: 3,
                flexWrap: "wrap",
                mb: 3,
                width: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "end",
                }}
              >
                {/* <Box
                  sx={{
                    fontSize: 14,
                    color: "#909298",
                    fontWeight: "bold",
                    mr: 1,
                  }}
                >
                  {adminInfo.name}
                </Box> */}
                {/* <label htmlFor="upload-avatar">
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      fontSize: 40,
                      cursor: "pointer",
                      bgcolor: "#e0e0e0", // hoặc "transparent"
                    }}
                  >
                    {previewAvatar && (
                      <img
                        src=" "
                        alt="avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                          setImageLoaded(false);
                        }}
                      />
                    )}
                  </Avatar>
                </label> */}

                <input id="upload-avatar" hidden accept="image/*" type="file" />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  width: "100%",
                  mt: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ width: "48%" }}>
                  <Typography fontSize={16} fontWeight="bold" mb={1}>
                    Tên
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    name="name"
                    value={adminInfo.name}
                    onChange={handleInputChange}
                    sx={{ ...inputStyle }}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Box>

                <Box sx={{ width: "48%" }}>
                  <Typography fontSize={16} fontWeight="bold" mb={1}>
                    Số điện thoại
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    disabled
                    value={adminInfo.phoneNumber}
                    InputProps={{ readOnly: true }}
                    sx={{ ...inputStyle }}
                  />
                </Box>
              </Box>

              {/* <Box sx={{ flex: 1, width: "48%" }}>
                <Typography fontSize={16} fontWeight="bold" mb={1}>
                  URL ảnh
                </Typography>
                <TextField
                  fullWidth
                  name="avatar"
                  value={adminInfo.avatar}
                  onChange={handleInputChange}
                  error={!!avatarError}
                  helperText={avatarError}
                  sx={{ ...inputStyle }}
                />
              </Box> */}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "#e0e0e0" }} />

        <Typography sx={{ fontSize: 16, fontWeight: "bold", mb: 3 }}>
          Bảo mật
        </Typography>
        <Box mb={3}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>
            Mật khẩu
          </Typography>
          <Button
            variant="text"
            onClick={handleOpenChangePassword}
            sx={{
              color: "var(--c_red_light)",
              fontSize: 13,
              textTransform: "none",
              p: 0,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Đổi mật khẩu
          </Button>
        </Box>

        <Dialog
          open={openChangePassword}
          onClose={handleCloseChangePassword}
          PaperProps={{
            sx: {
              borderRadius: "12px",
              p: 1,
              minWidth: { xs: "90%", sm: 400 },
            },
          }}
        >
          <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
            Đổi mật khẩu
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: 13, mb: 1 }}>
              Mật khẩu hiện tại
            </Typography>
            <TextField
              fullWidth
              type={showPassword.current ? "text" : "password"}
              required
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleInputChange}
              placeholder="Nhập mật khẩu hiện tại"
              sx={{ ...inputStyle, mb: 2 }}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility("current")}
                      edge="end"
                    >
                      {showPassword.current ? (
                        <VisibilityOff className={cx("icon_hide")} />
                      ) : (
                        <Visibility className={cx("icon_hide")} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Typography sx={{ fontSize: 13, mb: 1 }}>Mật khẩu mới</Typography>
            <TextField
              fullWidth
              type={showPassword.new ? "text" : "password"}
              required
              name="newPassword"
              value={form.newPassword}
              onChange={handleInputChange}
              placeholder="Nhập mật khẩu mới"
              sx={{ ...inputStyle, mb: 2 }}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility("new")}
                      edge="end"
                    >
                      {showPassword.new ? (
                        <VisibilityOff className={cx("icon_hide")} />
                      ) : (
                        <Visibility className={cx("icon_hide")} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Typography sx={{ fontSize: 13, mb: 1 }}>
              Nhập lại mật khẩu mới
            </Typography>
            <TextField
              fullWidth
              type={showPassword.confirm ? "text" : "password"}
              required
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleInputChange}
              placeholder="Nhập lại mật khẩu mới"
              sx={{ ...inputStyle, mb: 2 }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility("confirm")}
                      edge="end"
                    >
                      {showPassword.confirm ? (
                        <VisibilityOff className={cx("icon_hide")} />
                      ) : (
                        <Visibility className={cx("icon_hide")} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseChangePassword}
              sx={{
                fontSize: 13,
                color: "#1e1e1e",
                textTransform: "none",
                "&:hover": { bgcolor: "#f0f2f5" },
              }}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#0F172A",
                color: "#fff",
                fontSize: 13,
                textTransform: "none",
                px: 3,
                "&:hover": { bgcolor: "#1e293b" },
                borderRadius: "8px",
              }}
              onClick={handleChangePassword}
            >
              Đổi mật khẩu
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

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

export default Profile;
