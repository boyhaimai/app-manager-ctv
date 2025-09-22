import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Chip as Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  Typography,
  Box,
  TextField,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import classNames from "classnames/bind";
import {
  ChevronDown,
  Users,
  UserCheck,
  Shield,
  Eye,
  EllipsisVertical,
  Ban,
  LockOpen,
} from "lucide-react";

import styles from "./admin.module.scss";
import {
  ChevronLeft,
  ChevronRight,
  Close,
  Delete,
  KeyboardArrowRight,
  RadioButtonChecked,
  Search,
} from "@mui/icons-material";

const cx = classNames.bind(styles);

const urlGetInfoAdmin = "https://wf.mkt04.vawayai.com/webhook/admin";
const urlUpdateBloack = "https://wf.mkt04.vawayai.com/webhook/update_banded";
const urlDeleteAccount = "https://wf.mkt04.vawayai.com/webhook/delete_account";
const urlSetRole = "https://wf.mkt04.vawayai.com/webhook/set_role";
const urlUpdateExpire = "https://wf.mkt04.vawayai.com/webhook/update_expire";

const roleMap = {
  0: { label: "Admin", icon: Shield, color: "error" },
  1: { label: "Quản lý", icon: UserCheck, color: "primary" },
  2: { label: "Người xem", icon: Eye, color: "default" },
};

const expireOptions = {
  "2 tuần": 14 * 24 * 60 * 60 * 1000,
  "3 tháng": 90 * 24 * 60 * 60 * 1000,
  "6 tháng": 180 * 24 * 60 * 60 * 1000,
  "9 tháng": 270 * 24 * 60 * 60 * 1000,
  "1 năm": 365 * 24 * 60 * 60 * 1000,
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_accounts: 0,
    total_admin: 0,
    total_manager: 0,
    total_banned: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const wrapperRef = useRef();
  const headerRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [roleRequest, setRoleRequest] = useState(null);

  const rowsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isLoading) return;

      setIsLoading(true);

      const res = await fetch(urlGetInfoAdmin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // ❌ bỏ limit/offset
        body: JSON.stringify({}),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Không parse được:", text);
        return;
      }

      const result = Array.isArray(data) ? data[0]?.result : data?.result;
      if (result) {
        setUsers(result.accounts || []);
        setStats({
          total_accounts: result.total_accounts,
          total_admin: result.total_admin,
          total_manager: result.total_manager,
          total_banned: result.total_banned,
        });
      }
    } catch (err) {
      console.error("Lỗi fetch admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // lần đầu mount
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // khi đổi page
  useEffect(() => {
    if (page > 0) {
      fetchUsers(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  useEffect(() => {
    const updateUserRole = async () => {
      if (!pendingRole) return;

      const { userId, role } = pendingRole;
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const roleValue = role === "admin" ? 0 : role === "manager" ? 1 : 2;

      if (user.role === roleValue) {
        setSnackbar({
          open: true,
          message: `User này đã là ${roleMap[roleValue].label}`,
          severity: "warning",
        });
        setPendingRole(null);
        handleMenuClose();
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(urlSetRole, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            phone: user.phone,
            role: roleValue,
          }),
        });

        const result = await res.json();
        if (Array.isArray(result) && result[0]?.success) {
          setUsers(
            users.map((u) => (u.id === userId ? { ...u, role: roleValue } : u))
          );
          setSnackbar({
            open: true,
            message:
              result[0]?.message ||
              `Đổi vai trò thành công: ${roleMap[roleValue].label}`,
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: result[0]?.message || "Đổi vai trò thất bại",
            severity: "error",
          });
        }
      } catch (err) {
        console.error("Lỗi set role:", err);
        setSnackbar({
          open: true,
          message: "Có lỗi xảy ra khi đổi vai trò",
          severity: "error",
        });
      } finally {
        setPendingRole(null);
        handleMenuClose();
      }
    };

    updateUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRole]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = u.name_customer || ""; // API trả về name_customer
    const phone = u.phone || "";
    const roleInfo = roleMap[u.role] || {};
    const roleLabel = roleInfo.label ? roleInfo.label.toLowerCase() : "";

    return (
      name.toLowerCase().includes(term) ||
      phone.includes(term) ||
      roleLabel.includes(term)
    );
  });

  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalPages = Math.ceil(users.length / rowsPerPage);

  const handleMoreMenuOpen = (event, user) => {
    console.log("👉 Open menu cho user:", user);
    setMoreAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMoreMenuClose = () => {
    console.log("👉 Menu đóng");
    setMoreAnchorEl(null);
    // setSelectedUser(null);
  };

  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
  };

  const handleOpenDeleteDialog = (user) => {
    console.log("👉 Mở dialog xoá cho user:", user);
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    console.log("👉 Confirm delete:", selectedUser);
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlDeleteAccount, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          phone: selectedUser.phone,
        }),
      });

      const result = await res.json();
      if (result[0]?.success) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        setSnackbar({
          open: true,
          message: "Xoá tài khoản thành công",
          severity: "success",
        });
      } else {
        console.error("API trả về lỗi:", result);
        setSnackbar({
          open: true,
          message: "Xoá tài khoản thất bại",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Lỗi xoá account:", err);
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi xoá tài khoản",
        severity: "error",
      });
    } finally {
      setOpenDeleteDialog(false);
      setMoreAnchorEl(null); // ✅ Đóng menu ở đây
      setSelectedUser(null);
    }
  };

  const handleExtendExpire = async (label) => {
    if (!selectedUser) return;

    // Nếu là admin => expire_at = "0"
    if (selectedUser.expire_at === "0") {
      setSnackbar({
        open: true,
        message: "Đây là tài khoản Admin, không cần gia hạn",
        severity: "info",
      });
      return;
    }

    const extendMs = expireOptions[label];
    if (!extendMs) return;

    const currentExpire = new Date(selectedUser.expire_at);
    const newExpire = new Date(currentExpire.getTime() + extendMs);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlUpdateExpire, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          phone: selectedUser.phone,
          expire_at: newExpire.toISOString(),
        }),
      });

      const result = await res.json();
      if (Array.isArray(result) && result[0]?.success) {
        // ✅ update state với expire mới
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id
              ? { ...u, expire_at: newExpire.toISOString() }
              : u
          )
        );

        // format thời gian hết hạn mới
        const formattedExpire = newExpire.toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        setSnackbar({
          open: true,
          message: `Gia hạn thành công thêm ${label}. Account sẽ hết hạn vào ${formattedExpire}`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: result[0]?.message || "Gia hạn thất bại",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Lỗi update expire:", err);
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi gia hạn",
        severity: "error",
      });
    } finally {
      handleSubMenuClose();
      handleMoreMenuClose();
    }
  };

  const totalUsers = users.length;

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
            fontSize: "20px",
            color: "white",
            ml: 2,
          }}
        >
          Admin Dashboard
        </Typography>
      </Box>
      <div
        style={{ minHeight: "100vh", padding: "24px", marginTop: "50px" }}
        className={cx("container")}
      >
        <div style={{ width: "100%" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <div>
              <Typography variant="body2" color="white">
                Quản lý người dùng và phân quyền
              </Typography>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} color="white" />
              <Typography variant="body2" color="white">
                Tổng số tài khoản: {totalUsers}
              </Typography>
            </div>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            <Card>
              <CardHeader
                title="Tổng tài khoản"
                titleTypographyProps={{ fontSize: 22, fontWeight: "bold" }}
              />
              <CardContent>
                <Typography variant="h5">{stats.total_accounts}</Typography>
                <Typography
                  variant="caption"
                  color="success.main"
                  sx={{ fontSize: 14 }}
                >
                  Tổng số tài khoản hệ thống
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Admin"
                titleTypographyProps={{ fontSize: 22, fontWeight: "bold" }}
              />
              <CardContent>
                <Typography variant="h5">{stats.total_admin}</Typography>
                <Typography variant="caption" sx={{ fontSize: 14 }}>
                  Quyền cao nhất
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Quản lý"
                titleTypographyProps={{ fontSize: 22, fontWeight: "bold" }}
              />
              <CardContent>
                <Typography variant="h5">{stats.total_manager}</Typography>
                <Typography variant="caption" sx={{ fontSize: 14 }}>
                  Quyền quản lý
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Account bị chặn"
                titleTypographyProps={{ fontSize: 22, fontWeight: "bold" }}
              />
              <CardContent>
                <Typography variant="h5">{stats.total_banned}</Typography>
                <Typography variant="caption" sx={{ fontSize: 14 }}>
                  Account Block
                </Typography>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Box
            sx={{ display: "flex", flexDirection: "column", height: " 100%" }}
          >
            <Card
              sx={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                height: "auto",
                marginBottom: "100px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  flexDirection: { xs: "column", sm: "row" }, // 👈 mobile xuống dòng
                  gap: { xs: 2, sm: 0 }, // thêm khoảng cách khi column
                }}
              >
                <CardHeader
                  title="Danh sách người dùng"
                  subheader="Quản lý thông tin và phân quyền cho từng tài khoản"
                  titleTypographyProps={{ fontSize: 20, fontWeight: "bold" }}
                  subheaderTypographyProps={{
                    fontSize: 16,
                    color: "text.secondary",
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    mr: 2,
                  }}
                >
                  <TextField
                    className={cx("search_input")}
                    size="small"
                    variant="outlined"
                    placeholder="Tìm kiếm..."
                    value={searchInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchInput(val);
                      if (val === "") {
                        setSearchTerm(""); // reset khi xoá hết
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSearchTerm(searchInput);
                      }
                    }}
                    sx={{ width: 250, borderRadius: "10px" }}
                    InputProps={{
                      endAdornment: searchInput && (
                        <Button
                          onClick={() => {
                            setSearchInput("");
                            setSearchTerm("");
                          }}
                          sx={{ minWidth: "30px" }}
                        >
                          <Close fontSize="10px" />
                        </Button>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => setSearchTerm(searchInput)}
                    sx={{
                      minWidth: "40px",
                      borderRadius: "8px",
                      background: "var(--b_liner)",
                    }}
                  >
                    <Search fontSize="small" />
                  </Button>
                </Box>
              </Box>
              <CardContent sx={{ flex: 1, overflowY: "auto", padding: 0 }}>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{ background: "var(--c_header_table) !important" }}
                    >
                      <TableCell className={cx("title_table")}>
                        Trạng thái
                      </TableCell>
                      <TableCell className={cx("title_table")}>
                        Tên người dùng
                      </TableCell>
                      <TableCell className={cx("title_table")}>
                        Số điện thoại
                      </TableCell>
                      <TableCell className={cx("title_table")}>
                        Thời gian tạo
                      </TableCell>
                      <TableCell className={cx("title_table")}>
                        Thời gian hết hạn
                      </TableCell>
                      <TableCell className={cx("title_table")}>
                        Vai trò
                      </TableCell>
                      <TableCell className={cx("title_table")}>
                        Thao tác
                      </TableCell>
                      <TableCell className={cx("title_table")}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody
                    sx={{
                      "& .MuiTableRow-root:hover": {
                        background: "#f9fafb",
                        cursor: "pointer",
                      },
                    }}
                  >
                    {paginatedUsers.map((user) => {
                      const roleInfo = roleMap[user.role] || roleMap[2];
                      const IconComponent = roleInfo.icon;
                      return (
                        <TableRow key={user.id}>
                          <TableCell align="center">
                            {user.expire_at === "0" ? (
                              <RadioButtonChecked
                                sx={{ color: "green", fontSize: "20px" }}
                              />
                            ) : new Date(user.expire_at) > new Date() ? (
                              <RadioButtonChecked
                                sx={{ color: "green", fontSize: "20px" }}
                              />
                            ) : (
                              <RadioButtonChecked
                                sx={{ color: "red", fontSize: "20px" }}
                              />
                            )}
                          </TableCell>
                          <TableCell className={cx("item_table")}>
                            {user.name_customer}
                          </TableCell>
                          <TableCell className={cx("item_table")}>
                            {user.phone}
                          </TableCell>
                          <TableCell className={cx("item_table")}>
                            {new Date(user.created_at).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </TableCell>

                          <TableCell className={cx("item_table")}>
                            {user.expire_at === "0"
                              ? "Vô hạn"
                              : new Date(user.expire_at).toLocaleString(
                                  "vi-VN",
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                )}
                          </TableCell>

                          <TableCell className={cx("item_table")}>
                            <Badge
                              label={roleInfo.label}
                              color={roleInfo.color}
                              icon={<IconComponent size={14} />}
                              variant="outlined"
                              sx={{ fontSize: "17px" }}
                            />
                          </TableCell>
                          <TableCell className={cx("item_table")}>
                            <Button
                              variant="outlined"
                              size="small"
                              endIcon={<ChevronDown size={16} />}
                              onClick={(e) => handleMenuOpen(e, user)}
                              sx={{
                                textTransform: "none",
                                outline: "none",
                                fontSize: "17px",
                              }}
                            >
                              Đổi vai trò
                            </Button>
                          </TableCell>
                          <TableCell className={cx("item_table")}>
                            <EllipsisVertical
                              size={16}
                              onClick={(e) => handleMoreMenuOpen(e, user)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>

                  {/* More menu đặt ngoài map */}
                  <Menu
                    anchorEl={moreAnchorEl}
                    open={Boolean(moreAnchorEl)}
                    onClose={handleMoreMenuClose}
                  >
                    {/* Gia hạn có submenu */}
                    <MenuItem
                      onClick={(e) => setSubMenuAnchorEl(e.currentTarget)}
                    >
                      <LockOpen
                        style={{ marginRight: "8px", fontSize: "20px" }}
                      />
                      Gia hạn
                      <KeyboardArrowRight
                        fontSize="small"
                        style={{ marginLeft: "auto" }}
                      />
                    </MenuItem>

                    {/* Submenu */}
                    <Menu
                      anchorEl={subMenuAnchorEl}
                      open={Boolean(subMenuAnchorEl)}
                      onClose={handleSubMenuClose}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                      MenuListProps={{
                        onMouseLeave: handleSubMenuClose,
                      }}
                    >
                      <MenuItem onClick={() => handleExtendExpire("2 tuần")}>
                        2 tuần
                      </MenuItem>
                      <MenuItem onClick={() => handleExtendExpire("3 tháng")}>
                        3 tháng
                      </MenuItem>
                      <MenuItem onClick={() => handleExtendExpire("6 tháng")}>
                        6 tháng
                      </MenuItem>
                      <MenuItem onClick={() => handleExtendExpire("9 tháng")}>
                        9 tháng
                      </MenuItem>
                      <MenuItem onClick={() => handleExtendExpire("1 năm")}>
                        1 năm
                      </MenuItem>
                    </Menu>

                    {/* Chặn tài khoản */}
                    <MenuItem>
                      <Ban style={{ marginRight: "8px", fontSize: "20px" }} />
                      Chặn tài khoản này
                      <Switch
                        checked={selectedUser?.is_ban || false}
                        onChange={async () => {
                          if (!selectedUser) return;
                          const newStatus = !selectedUser.is_ban;
                          try {
                            const token = localStorage.getItem("token");
                            const res = await fetch(urlUpdateBloack, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                user_id: selectedUser.id,
                                phone: selectedUser.phone,
                                is_ban: newStatus,
                              }),
                            });
                            const result = await res.json();
                            if (result[0]?.success) {
                              setUsers(
                                users.map((u) =>
                                  u.id === selectedUser.id
                                    ? { ...u, is_ban: newStatus }
                                    : u
                                )
                              );
                              setSelectedUser({
                                ...selectedUser,
                                is_ban: newStatus,
                              });
                            }
                          } catch (err) {
                            console.error("Lỗi update block:", err);
                          }
                        }}
                        sx={{ ml: "auto" }}
                      />
                    </MenuItem>

                    <MenuItem
                      onClick={() => handleOpenDeleteDialog(selectedUser)}
                    >
                      <Delete
                        style={{ marginRight: "8px", fontSize: "20px" }}
                      />
                      Xóa tài khoản
                    </MenuItem>
                  </Menu>
                </Table>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <Typography fontSize={14} color="text.secondary">
                    Showing{" "}
                    {Math.min(
                      rowsPerPage,
                      filteredUsers.length - page * rowsPerPage
                    )}{" "}
                    of {filteredUsers.length}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      disabled={page === 0}
                      onClick={() => setPage((prev) => prev - 1)}
                      sx={{
                        minWidth: 32,
                        p: "2px 8px",
                        textTransform: "none",
                      }}
                    >
                      <ChevronLeft sx={{ fontSize: 32 }} />
                    </Button>

                    {Array.from({
                      length: Math.ceil(filteredUsers.length / rowsPerPage),
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
                      variant="contained"
                      disabled={
                        page >=
                        Math.ceil(filteredUsers.length / rowsPerPage) - 1
                      }
                      onClick={() => setPage((prev) => prev + 1)}
                      sx={{
                        minWidth: 32,
                        p: "2px 8px",
                        textTransform: "none",
                      }}
                    >
                      <ChevronRight sx={{ fontSize: 32 }} />
                    </Button>
                  </Box>
                </Box>

                {/* Dropdown menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem
                    onClick={() => {
                      setRoleRequest({
                        userId: selectedUser?.id,
                        role: "admin",
                      });
                      setOpenRoleDialog(true);
                    }}
                  >
                    <Shield size={16} style={{ marginRight: "8px" }} /> Admin
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setRoleRequest({
                        userId: selectedUser?.id,
                        role: "manager",
                      });
                      setOpenRoleDialog(true);
                    }}
                  >
                    <UserCheck size={16} style={{ marginRight: "8px" }} /> Quản
                    lý
                  </MenuItem>
                </Menu>
              </CardContent>
            </Card>
          </Box>
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
          >
            <DialogTitle>Xác nhận xoá</DialogTitle>
            <DialogContent>
              Bạn có chắc chắn muốn xoá tài khoản
              <strong> {selectedUser?.name_customer}</strong>(
              {selectedUser?.phone}) không?
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
              <Button
                color="error"
                variant="contained"
                onClick={handleConfirmDelete}
              >
                Xoá
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openRoleDialog}
            onClose={() => setOpenRoleDialog(false)}
          >
            <DialogContent sx={{ fontSize: 25 }}>
              Bạn có chắc chắn muốn gán quyền
              <strong>
                {" "}
                {roleRequest?.role === "admin" ? "Admin" : "Quản lý"}{" "}
              </strong>
              cho tài khoản <strong>{selectedUser?.name_customer}</strong> (
              {selectedUser?.phone}) không?
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenRoleDialog(false)}
                sx={{ textTransform: "none" }}
              >
                Hủy
              </Button>
              <Button
                color="primary"
                variant="contained"
                onClick={() => {
                  setPendingRole(roleRequest); // ✅ chỉ set khi confirm
                  setOpenRoleDialog(false);
                }}
                sx={{ textTransform: "none" }}
              >
                Xác nhận
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
