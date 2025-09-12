import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  Add,
  Save,
  Chat,
  Group,
  QuestionAnswer,
  Close,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./SettingPage.module.scss";

const cx = classNames.bind(styles);
const urlGetInffoConfig = "https://wf.mkt04.vawayai.com/webhook/get_info_msg";
const urlUpdateConfig = "https://wf.mkt04.vawayai.com/webhook/update_config";
const urlDeleteConfig = "https://wf.mkt04.vawayai.com/webhook/delete_config";

function SettingPage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);

  // lấy danh sách config khi load trang
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(urlGetInffoConfig, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Phản hồi không hợp lệ:", text);
          return;
        }

        if (Array.isArray(data)) {
          setConfigs(data);
          if (data.length > 0) {
            setSelectedConfig(data[0]); // ✅ chọn config đầu
          }
        } else if (data.configs) {
          setConfigs(data.configs);
          if (data.configs.length > 0) {
            setSelectedConfig(data.configs[0]); // ✅ chọn config đầu
          }
        }
      } catch (err) {
        console.error("Lỗi khi load configs:", err);
      }
    };
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    if (!selectedConfig) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlUpdateConfig, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // gửi JWT
        },
        body: JSON.stringify(selectedConfig), // gửi config đang sửa
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert("Phản hồi không hợp lệ từ server: " + text);
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result.success === true) {
        alert(result.message || "Cập nhật thành công");
        setConfigs((prev) =>
          prev.map((cfg) =>
            cfg.id === selectedConfig.id ? selectedConfig : cfg
          )
        );
      } else {
        alert(result.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error("Lỗi:", err);
      alert("Có lỗi xảy ra khi gọi API cập nhật config.");
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá config này?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(urlDeleteConfig, {
        method: "POST", // n8n webhook thường là POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // gửi JWT token
        },
        body: JSON.stringify({ id }), // gửi id config cần xóa
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert("Phản hồi không hợp lệ từ server: " + text);
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result.success === true) {
        alert(result.message || "Đã xóa thành công");
        // cập nhật lại danh sách trên UI
        setConfigs((prev) => prev.filter((cfg) => cfg.id !== id));
        if (selectedConfig?.id === id) {
          setSelectedConfig(null);
        }
      } else {
        alert(result.message || "Xóa config thất bại");
      }
    } catch (err) {
      console.error("Lỗi xoá config:", err);
      alert("Có lỗi xảy ra khi gọi API xoá config.");
    }
  };

  const handlePushId = () => {
    if (!selectedConfig) return;
    navigate(`/chat/${selectedConfig.id}`);
    console.log("đi tới trang chat với id:", selectedConfig.id);
  };

  return (
    <div className={cx("wrapper")}>
      <Container>
        <Box
          className={cx("title_header")}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textTransform: "capitalize",
              fontWeight: 600,
            }}
          >
            Cài đặt
          </Typography>

          <Box display="flex" gap={2}>
            {/* Autocomplete chọn dự án */}
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
                labelId="config-select-label"
                value={selectedConfig?.id || ""}
                onChange={(e) => {
                  const chosen = configs.find((c) => c.id === e.target.value);
                  setSelectedConfig(chosen || null);
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
                    color: "var(--layer_background) !important",
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
                    value={cfg.id} // ⚡ vẫn dùng id để quản lý
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
                        e.stopPropagation(); // tránh trigger select
                        handleDeleteConfig(cfg.id);
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
              onClick={handleSave} // 👉 gắn handler
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
          {selectedConfig ? (
            <>
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
                value={selectedConfig.get_ctv}
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
                  sx={{ fontWeight: 600, color: "#333", fontSize: 18 }}
                >
                  Webhook các hội thoại
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                value={selectedConfig.get_chat}
                onChange={(e) =>
                  setSelectedConfig({
                    ...selectedConfig,
                    get_chat: e.target.value,
                  })
                }
              />

              {/* Webhook message */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
                <QuestionAnswer
                  sx={{ mr: 1, fontSize: 28, color: "#667eea" }}
                />
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
                value={selectedConfig.get_message}
                onChange={(e) =>
                  setSelectedConfig({
                    ...selectedConfig,
                    get_message: e.target.value,
                  })
                }
              />
            </>
          ) : (
            <Typography>Hãy chọn một dự án ở trên để xem chi tiết</Typography>
          )}
        </Box>
      </Container>
    </div>
  );
}

export default SettingPage;
