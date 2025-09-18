import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { useNavigate } from "react-router-dom";

import MenuCustom from "./Menu";
import MenuItemCustom from "./Menu/MenuItem";
import config from "~/config";
import {
  Dashboard,
  ErrorRounded,
  Logout,
  SettingsRounded,
} from "@mui/icons-material";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import styles from "./Sidebar.module.scss";
import Avatar from "~/Components/Avatar/Avatar";
import MobileBottomBar from "~/Components/MobileBottomBar/MobileBottomBar";

const cx = classNames.bind(styles);
const urlGetInfo = "https://wf.mkt04.vawayai.com/webhook/get_account_msg";

function Sidebar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const role = parseInt(localStorage.getItem("role"), 10);

  useEffect(() => {
    const fetchAdminInfo = async () => {
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
      }
    };

    fetchAdminInfo();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    localStorage.removeItem("token"); // xoá JWT
    navigate("/"); // quay lại trang login
  };

  return (
    <>
      <aside className={cx("wrapper")}>
        <h4 className={cx("title")}>Administration</h4>
        {role === 1 && (
          <MenuCustom>
            <MenuItemCustom
              title="Tổng quan"
              to={config.routes.manager_page}
              icon={<Dashboard className={cx("icon_menu")} />}
            />

            <Box className={cx("support")}>
              <MenuItemCustom
                title="Cài đặt"
                to="/profile"
                icon={<SettingsRounded className={cx("icon_menu")} />}
              />
              <MenuItemCustom
                title="About us"
                to="https://vaway.vn/"
                target="_blank"
                icon={<ErrorRounded className={cx("icon_menu")} />}
              />
            </Box>
          </MenuCustom>
        )}

        {/* Nếu role = 0 => menu admin */}
        {role === 0 && (
          <MenuCustom>
            <MenuItemCustom
              title="Dashboard Admin"
              to={config.routes.admin}
              icon={<Dashboard className={cx("icon_menu")} />}
            />
          </MenuCustom>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#f9fafb",
            maxWidth: 300,
            boxShadow: 1,
            p: 2,
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            backgroundColor: "#fff",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
          >
            <Avatar
              src="https://scontent.fhph1-2.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=cp0_dst-png_s40x40&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_eui2=AeGxjKmHmpEethSdohcuF97BWt9TLzuBU1Ba31MvO4FTUGKAJ1layeJ0SYNPOMhe-91l7wJKBeGi4_GeaTxz-TPJ&_nc_ohc=7CsbLZRM9FQQ7kNvwFiSnk2&_nc_oc=AdkGqBG9hwZ7_-_3ezMWEGDp1JseAZI6bhjhTTnle5ZYUuU8DavUFlBX9AAzxyvX92w&_nc_zt=24&_nc_ht=scontent.fhph1-2.fna&oh=00_AfYUMGp-mFYPW2Y6JgdtrrcUpOhO4czy7blh6tWMpMSmpw&oe=68EA1B3A"
              alt={adminInfo?.name || ""}
              className={cx("avatar")}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                fontWeight={600}
                fontSize={14}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "calc(150px - 10px)",
                }}
              >
                {adminInfo?.name || "Loading..."}
              </Typography>
              <Typography
                fontSize={12}
                color="text.secondary"
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "150px",
                }}
              >
                {adminInfo?.phoneNumber || ""}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClick} sx={{ flexShrink: 0 }}>
            <MoreVertIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: 60, horizontal: 20 }}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1,
                minWidth: 150,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden",
                "& .MuiMenuItem-root": {
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  transition: "all 0.2s ease",
                },
                "& .MuiMenuItem-root:hover": {
                  backgroundColor: "#f0f0f0",
                },
              },
            }}
          >
            <MenuItem onClick={handleLogout}>
              <Logout className={cx("icon_menu_sidebar")} />
              Đăng xuất
            </MenuItem>
          </Menu>
        </Box>
      </aside>
      <aside className={cx("wrapper_sidebar_mobile")}>
        <MobileBottomBar />
      </aside>
    </>
  );
}

export default Sidebar;
