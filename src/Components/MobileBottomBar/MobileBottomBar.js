import React, { useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Dashboard,
  SettingsRounded,
  ErrorRounded,
  Logout,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import styles from "./MobileBottomBar.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function MobileBottomBar() {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      <BottomNavigation
        value={value}
        onChange={(event, newValue) => setValue(newValue)}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          borderTop: "1px solid #ddd",
          display: { xs: "flex", md: "none" }, // chỉ mobile
        }}
        showLabels
      >
        <BottomNavigationAction
          label=""
          icon={<Dashboard fontSize="small" />}
          onClick={() => navigate("/manager-page")}
        />
        <BottomNavigationAction
          label=""
          icon={<SettingsRounded fontSize="small" />}
          onClick={() => navigate("/profile")}
        />
        <BottomNavigationAction
          icon={
            <Avatar
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              sx={{ width: 30, height: 30 }}
              onClick={handleAvatarClick}
            />
          }
        />
      </BottomNavigation>

      {/* Menu khi click avatar */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "10px", // Hiện menu từ phía trên icon
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom", // Điểm gốc là đáy của avatar/icon
          horizontal: "center",
        }}
        PaperProps={{
          style: {
            borderRadius: 12,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            marginTop: "-15px",
          },
        }}
      >
        <MenuItem onClick={() => window.open("https://vaway.vn/", "_blank")}>
          <ErrorRounded fontSize="small" sx={{ marginRight: 1 }} />
          Về chúng tôi
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ marginRight: 1 }} />
          Đăng xuất
        </MenuItem>
      </Menu>
    </>
  );
}

export default MobileBottomBar;
