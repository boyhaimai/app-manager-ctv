import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
} from "@mui/material";

import styles from "./Login.module.scss";
import classNames from "classnames/bind";
import vazoai from "~/Components/assets/image/vazoAI (1).png";
import { Lock, WarningAmber } from "@mui/icons-material";

const cx = classNames.bind(styles);

const urlRegister = "https://wf.mkt04.vawayai.com/webhook/register_msg";
const urlLogin = "https://wf.mkt04.vawayai.com/webhook/login_msg";
// const urlCheckExistToken =
//   "https://wf.mkt04.vawayai.com/webhook-test/check_exist_toekn";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function Login() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState(0); // 0 for Login, 1 for Register
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [cfToken, setCfToken] = useState("");
  const [cfTokenRegister, setCfTokenRegister] = useState("");

  let cipher = password;
  for (let i = 0; i < 12; i++) {
    // for (let i = 0; i < 36; i++) {
    cipher = btoa(cipher); // encode 6 lần
  }

  useEffect(() => {
    // gắn callback vào window để Turnstile gọi được
    window.cfCallback = (token) => {
      setCfToken(token);
      console.log("Turnstile token:", token);
    };

    // nạp script Turnstile nếu chưa có
    if (!document.querySelector("#cf-turnstile-script")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.id = "cf-turnstile-script";
      document.body.appendChild(script);
    }
  }, []);

  window.cfCallbackRegister = (token) => {
    setCfTokenRegister(token);
    console.log("Turnstile token (register):", token);
  };

  useEffect(() => {
    const savedPhone = localStorage.getItem("savedPhone");
    const savedPass = localStorage.getItem("savedPass");
    if (savedPhone && savedPass) {
      setPhone(savedPhone);
      try {
        setPassword(atob(savedPass)); // giải mã base64
        setRememberMe(true);
      } catch (e) {
        console.error("Giải mã mật khẩu thất bại:", e);
      }
    }
  }, []);

  const handleCloseDialog = () => {
    setDialog({ ...dialog, open: false });
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setLoginError("");
    setRegisterError("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!phone.trim() || !password.trim()) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập đầy đủ số điện thoại và mật khẩu.",
        severity: "error",
      });
      return; // ⛔ Không post
    }

    setIsLoading(true);

    try {
      const res = await fetch(urlLogin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({
          phone,
          encryptedPassword: cipher,
          cf_token: cfToken,
        }),
      });

      const text = await res.text();
      setIsLoading(false);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setLoginError("Phản hồi không hợp lệ từ server.");
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result.success === true || result.success === "true") {
        if (rememberMe) {
          localStorage.setItem("savedPhone", phone);
          localStorage.setItem("savedPass", btoa(password)); // mã hóa base64
        } else {
          localStorage.removeItem("savedPhone");
          localStorage.removeItem("savedPass");
        }
        // 1️⃣ Ưu tiên kiểm tra is_ban
        if (result.is_ban === true || result.is_ban === "true") {
          setDialog({
            open: true,
            title: "Tài khoản của bạn đã bị khóa",
            message:
              "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
            icon: <Lock color="error" sx={{ mr: 1 }} />,
          });
          return;
        }

        // 2️⃣ Kiểm tra expire_at (trừ khi expire_at = "0")
        if (result.expire_at !== "0" && result.expire_at) {
          if (new Date(result.expire_at) < new Date()) {
            setDialog({
              open: true,
              title: "Tài khoản của bạn đã hết hạn",
              message:
                "Tài khoản của bạn đã hết hạn. Vui lòng liên hệ trợ lý AI với số điện thoại Zalo: 0359686776 để gia hạn.",
              icon: <WarningAmber color="warning" sx={{ mr: 1 }} />,
            });
            return;
          }
        }

        // 3️⃣ Nếu hợp lệ thì cho login
        setSnackbar({
          open: true,
          message: result.message || "Đăng nhập thành công",
          severity: "success",
        });

        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        localStorage.setItem("phone", phone);
        localStorage.setItem("role", result.role);

        setTimeout(() => {
          if (parseInt(result.role) === 0) {
            navigate("/admin");
          } else if (parseInt(result.role) === 1) {
            navigate("/manager-page");
          } else {
            navigate("/");
          }
        }, 1500);
      } else {
        // Trường hợp thất bại
        const isCaptchaError = result.message?.includes("Captcha");
        setSnackbar({
          open: true,
          message:
            result.message ||
            (isCaptchaError
              ? "Captcha không hợp lệ hoặc đã hết hạn. Vui lòng thử lại."
              : "Sai tài khoản hoặc mật khẩu"),
          severity: "error",
        });

        // Nếu là lỗi Captcha, reset token để user tick lại
        if (isCaptchaError) {
          setCfToken(""); // xóa token cũ
          if (window.turnstile) {
            window.turnstile.reset(); // reset Turnstile
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      setLoginError("Có lỗi xảy ra, vui lòng thử lại.");
      console.error(error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (
      !name.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập đầy đủ tất cả các trường đăng ký.",
        severity: "error",
      });
      return;
    }

    if (password.length < 6) {
      setSnackbar({
        open: true,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
        severity: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setSnackbar({
        open: true,
        message: "Mật khẩu xác nhận không khớp.",
        severity: "error",
      });
      return;
    }

    if (!cfTokenRegister) {
      setSnackbar({
        open: true,
        message: "Vui lòng xác thực Captcha trước khi đăng ký.",
        severity: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(urlRegister, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
        },
        body: JSON.stringify({
          name,
          phone,
          encryptedPassword: cipher,
          cf_token: cfTokenRegister, // gửi token Captcha
        }),
      });

      const text = await res.text();
      setIsLoading(false);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setRegisterError("Phản hồi không hợp lệ từ server.");
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result.success === "true" || result.success === true) {
        setSnackbar({
          open: true,
          message: result.message || "Đăng ký thành công! Vui lòng đăng nhập.",
          severity: "success",
        });
        setValue(0);
        setTimeout(() => navigate("/"), 1500);
      } else {
        // kiểm tra lỗi captcha
        const isCaptchaError = result.message?.includes("Captcha");

        setSnackbar({
          open: true,
          message:
            result.message ||
            (isCaptchaError
              ? "Captcha không hợp lệ hoặc đã hết hạn. Vui lòng thử lại."
              : "Đăng ký thất bại. Vui lòng thử lại."),
          severity: "error",
        });

        if (isCaptchaError) {
          setCfTokenRegister(""); // xóa token cũ
          if (window.turnstile) {
            window.turnstile.reset(); // reset Turnstile
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      setRegisterError("Có lỗi xảy ra, vui lòng thử lại.");
      console.error(error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <img src={vazoai} alt="logo" className={cx("logo")} />
          <h1 className={styles.title}>
            {value === 0 ? "Đăng nhập" : "Đăng ký"}
          </h1>
          <p className={styles.subtitle}>
            {value === 0
              ? "Chào mừng bạn quay trở lại"
              : "Hãy tạo tài khoản mới"}
          </p>
        </div>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="login and register tabs"
            centered
            className={styles.tabs}
          >
            <Tab
              label="Đăng nhập"
              {...a11yProps(0)}
              sx={{ textTransform: "none" }}
            />
            <Tab
              label="Đăng ký"
              {...a11yProps(1)}
              sx={{ textTransform: "none" }}
            />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone-login" className={styles.label}>
                Số điện thoại
              </label>
              <input
                type="text"
                id="phone-login"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
                placeholder="Nhập phone"
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password-login" className={styles.label}>
                Mật khẩu
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Nhập mật khẩu"
                  disabled={isLoading}
                />
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  className={styles.passwordVisibilityIcon}
                >
                  {showPassword ? (
                    <VisibilityOff className={cx("icon_show")} />
                  ) : (
                    <Visibility className={cx("icon_show")} />
                  )}
                </IconButton>
              </div>
            </div>

            <div
              className="cf-turnstile"
              data-sitekey="0x4AAAAAAB2ihgOXExfs5zoP"
              data-callback="cfCallback"
            ></div>

            {loginError && <p className={styles.error}>{loginError}</p>}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "8px",
                marginLeft: "10px",
              }}
            >
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                htmlFor="rememberMe"
                style={{ marginLeft: "6px", fontSize: "18px" }}
              >
                Nhớ mật khẩu
              </label>
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loading}>
                  <span className={styles.spinner}></span>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <form onSubmit={handleRegister} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="name-register" className={styles.label}>
                Tên
              </label>
              <input
                type="text"
                id="name-register"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Nhập tên"
                disabled={isLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone-register" className={styles.label}>
                Số điện thoại
              </label>
              <input
                type="text"
                id="phone-register"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
                placeholder="Nhập phone"
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password-register" className={styles.label}>
                Mật khẩu
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-register"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Nhập mật khẩu"
                  disabled={isLoading}
                />
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  className={styles.passwordVisibilityIcon}
                >
                  {showPassword ? (
                    <VisibilityOff className={cx("icon_show")} />
                  ) : (
                    <Visibility className={cx("icon_show")} />
                  )}
                </IconButton>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label
                htmlFor="confirm-password-register"
                className={styles.label}
              >
                Xác nhận mật khẩu
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirm-password-register"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  disabled={isLoading}
                />
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  className={styles.passwordVisibilityIcon}
                >
                  {showPassword ? (
                    <VisibilityOff className={cx("icon_show")} />
                  ) : (
                    <Visibility className={cx("icon_show")} />
                  )}
                </IconButton>
              </div>
            </div>

            <div
              className="cf-turnstile"
              data-sitekey="0x4AAAAAAB2ihgOXExfs5zoP"
              data-callback="cfCallbackRegister"
            ></div>

            {registerError && <p className={styles.error}>{registerError}</p>}

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loading}>
                  <span className={styles.spinner}></span>
                  Đang đăng ký...
                </span>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>
        </TabPanel>
      </div>

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

      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 600,
            color: "red",
          }}
        >
          {dialog.icon}
          {dialog.title}
        </DialogTitle>
        <DialogContent>
          <p style={{ fontSize: 24 }}>{dialog.message}</p>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              textTransform: "none",
              color: "white",
              background: "var(--b_liner)",
              cursor: "pointer",
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Login;
