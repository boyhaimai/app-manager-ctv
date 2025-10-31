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
const quen_pass = "https://wf.mkt04.vawayai.com/webhook/quen_pass";

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
// Thêm vào trước component Login
const prefixMap = {
  "0162": "032",
  "0163": "033",
  "0164": "034",
  "0165": "035",
  "0166": "036",
  "0167": "037",
  "0168": "038",
  "0169": "039",
  "0120": "070",
  "0121": "079",
  "0122": "077",
  "0123": "083",
  "0124": "084",
  "0125": "085",
  "0126": "076",
  "0127": "081",
  "0128": "078",
  "0129": "082",
  "0182": "052",
  "0186": "056",
  "0188": "058",
  "0199": "059",
};

const validPrefixes = [
  "032",
  "033",
  "034",
  "035",
  "036",
  "037",
  "038",
  "039",
  "070",
  "076",
  "077",
  "078",
  "079",
  "081",
  "082",
  "083",
  "084",
  "085",
  "088",
  "052",
  "056",
  "058",
  "059",
  "090",
  "091",
  "092",
  "093",
  "094",
  "095",
  "096",
  "097",
  "098",
  "099",
];

function validatePhone(input) {
  let digits = (input || "").replace(/\D/g, "");

  if (digits.length === 11) {
    const oldPrefix = digits.slice(0, 4);
    const rest = digits.slice(4);
    const newPrefix = prefixMap[oldPrefix];
    if (!newPrefix) return null;
    digits = newPrefix + rest;
  }

  if (digits.length === 10 && validPrefixes.includes(digits.slice(0, 3))) {
    return digits;
  }
  return null;
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
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [forgotPhone, setForgotPhone] = useState(""); 
  const [confirmForgotDialog, setConfirmForgotDialog] = useState({
    open: false,
    phone: "",
  });

  let cipher = password;
  for (let i = 0; i < 12; i++) {
    // for (let i = 0; i < 36; i++) {
    cipher = btoa(cipher); // encode 6 lần
  }

  useEffect(() => {
    function renderCaptcha() {
      if (!window.turnstile) return;

      if (
        value === 0 &&
        !document.querySelector(".cf-turnstile-login").childNodes.length
      ) {
        window.turnstile.render(document.querySelector(".cf-turnstile-login"), {
          sitekey: "0x4AAAAAAB2ihgOXExfs5zoP",
          callback: (token) => setCfToken(token),
        });
      }

      if (
        value === 1 &&
        !document.querySelector(".cf-turnstile-register").childNodes.length
      ) {
        window.turnstile.render(
          document.querySelector(".cf-turnstile-register"),
          {
            sitekey: "0x4AAAAAAB2ihgOXExfs5zoP",
            callback: (token) => setCfTokenRegister(token),
          }
        );
      }
    }

    const scriptId = "cf-turnstile-script";
    let script = document.querySelector(`#${scriptId}`);
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      script.onload = renderCaptcha;
      document.body.appendChild(script);
    } else {
      renderCaptcha();
    }
  }, [value]);

  const resetCaptcha = () => {
    if (!window.turnstile) return;
    if (value === 0) {
      window.turnstile.reset(document.querySelector(".cf-turnstile-login"));
      setCfToken("");
    } else if (value === 1) {
      window.turnstile.reset(document.querySelector(".cf-turnstile-register"));
      setCfTokenRegister("");
    }
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

    const normalizedPhone = validatePhone(phone);
    if (!normalizedPhone) {
      setSnackbar({
        open: true,
        message: "Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam 10 số.",
        severity: "error",
      });
      return;
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
          phone: normalizedPhone,
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
                "Tài khoản của bạn đã hết hạn. Vui lòng liên hệ quản trị viên với số điện thoại Zalo: 0984635286 để gia hạn.",
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
          resetCaptcha();
        }
      }
    } catch (error) {
      setIsLoading(false);
      setLoginError("Có lỗi xảy ra, vui lòng thử lại.");
      console.error(error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPhone.trim()) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập số điện thoại trước khi yêu cầu quên mật khẩu.",
        severity: "error",
      });
      return;
    }

    const normalizedPhone = validatePhone(forgotPhone);
    if (!normalizedPhone) {
      setSnackbar({
        open: true,
        message: "Số điện thoại không hợp lệ.",
        severity: "error",
      });
      return;
    }

    // ✅ Mở dialog xác nhận
    setConfirmForgotDialog({ open: true, phone: normalizedPhone });
  };

  const handleConfirmForgot = async () => {
    const normalizedPhone = confirmForgotDialog.phone;
    setConfirmForgotDialog({ open: false, phone: "" });

    try {
      const res = await fetch(quen_pass, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setSnackbar({
          open: true,
          message: "Phản hồi không hợp lệ từ server.",
          severity: "error",
        });
        return;
      }

      setSnackbar({
        open: true,
        message:
          data.message || "Yêu cầu quên mật khẩu đã được gửi cho bạn qua Zalo.",
        severity: data.success ? "success" : "error",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra, vui lòng thử lại.",
        severity: "error",
      });
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
    const normalizedPhone = validatePhone(phone);
    if (!normalizedPhone) {
      setSnackbar({
        open: true,
        message: "Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam 10 số.",
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
          phone: normalizedPhone,
          password,
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
          resetCaptcha();
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
          {!isForgotPass ? (
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="phone-login" className={styles.label}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
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

              <div
                className="cf-turnstile-login"
                data-sitekey="0x4AAAAAAB2ihgOXExfs5zoP"
                data-callback="cfCallbackLogin"
              ></div>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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

                <button
                  type="button"
                  className={styles.loginButton}
                  onClick={() => setIsForgotPass(true)}
                >
                  Quên mật khẩu
                </button>
              </Box>
              {/* <button
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
              </button> */}
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className={styles.loginForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="forgot-phone" className={styles.label}>
                  Nhập số điện thoại
                </label>
                <input
                  type="tel"
                  id="forgot-phone"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  className={styles.input}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <button
                  type="button"
                  className={styles.loginButton}
                  style={{ backgroundColor: "#888", fontSize: 14 }}
                  onClick={() => setIsForgotPass(false)}
                >
                  Quay lại đăng nhập
                </button>
                <button
                  type="submit"
                  className={styles.loginButton}
                  style={{ fontSize: 14 }}
                >
                  Quên mật khẩu
                </button>
              </Box>
            </form>
          )}
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
                type="tel"
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
              className="cf-turnstile-register"
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
        open={confirmForgotDialog.open}
        onClose={() => setConfirmForgotDialog({ open: false, phone: "" })}
        aria-labelledby="confirm-forgot-dialog-title"
      >
        <DialogTitle
          id="confirm-forgot-dialog-title"
          sx={{
            textAlign: "center",
            fontWeight: 600,
            color: "var(--b_liner)",
            fontSize: 22,
          }}
        >
          Xác nhận quên mật khẩu
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", mt: 1 }}>
          <p style={{ fontSize: 18 }}>
            Bạn có chắc chắn muốn yêu cầu <br />
            reset mật khẩu cho số{" "}
            <strong style={{ color: "var(--b_liner)" }}>
              {confirmForgotDialog.phone}
            </strong>{" "}
            không?
          </p>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmForgotDialog({ open: false, phone: "" })}
            sx={{
              textTransform: "none",
              fontSize: 15,
              borderColor: "gray",
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmForgot}
            sx={{
              textTransform: "none",
              background: "var(--b_liner)",
              color: "white",
              fontSize: 15,
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

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
