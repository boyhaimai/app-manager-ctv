import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Alert, Snackbar } from "@mui/material";

import styles from "./Login.module.scss";
import classNames from "classnames/bind";
import vazoai from "~/Components/assets/image/vazoAI (1).png";

const cx = classNames.bind(styles);

const urlRegister = "https://wf.mkt04.vawayai.com/webhook/register_msg";
const urlLogin = "https://wf.mkt04.vawayai.com/webhook/login_msg";

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
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
      setLoginError("Vui lòng nhập đầy đủ số điện thoại và mật khẩu.");
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
        body: JSON.stringify({ phone, password }),
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
        setSnackbar({
          open: true,
          message: result.message || "Đăng nhập thành công",
          severity: "success",
        });
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        localStorage.setItem("phone", phone);
        setTimeout(() => navigate("/manager-page"), 1500);
      } else {
        // ❌ Trường hợp sai mật khẩu hoặc thất bại
        setSnackbar({
          open: true,
          message: result.message || "Sai tài khoản hoặc mật khẩu",
          severity: "error",
        });
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
      setRegisterError("Vui lòng nhập đầy đủ thông tin đăng ký.");
      return;
    }
    if (password.length < 6) {
      setRegisterError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError("Mật khẩu xác nhận không khớp.");
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
        body: JSON.stringify({ name, phone, password }), // 👈 gửi thêm name
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

      if (result.success === "true") {
        setSnackbar({
          open: true,
          message: result.message || "Đăng ký thành công! Vui lòng đăng nhập.",
          severity: "success",
        });
        setValue(0);
        setTimeout(() => navigate("/"), 1500);
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
          <img src={vazoai} alt="logo" className={cx('logo')} />
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

            {loginError && <p className={styles.error}>{loginError}</p>}

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
    </div>
  );
}

export default Login;
