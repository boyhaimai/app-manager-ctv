import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./CTVList.module.scss";
import { Link, useParams } from "react-router-dom";

import { useConfig } from "~/Contexts/ConfigContext";

const cx = classNames.bind(styles);
const urlGetConfigWithId =
  "https://wf.mkt04.vawayai.com/webhook/get_config_with_id";

function CTVList({ onSelect }) {
  const [ctvData, setCtvData] = useState([]);
  const { configId, ctvId } = useParams();
  const { config, setConfig } = useConfig();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!configId) return;
    const token = localStorage.getItem("token");

    fetch(urlGetConfigWithId, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: configId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const result = Array.isArray(data) ? data[0] : data;
        if (result) {
          setConfig(result);
          setCtvData([]);
          setPage(0);
          setHasMore(true);
          loadCTVs(result.get_ctv, 0);
        }
      })
      .catch((err) => console.error("Lỗi:", err));
  }, [configId, setConfig]);

  const loadCTVs = (url, pageNum = 0) => {
    if (isLoading || !url) return;
    setIsLoading(true);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
      },
      body: JSON.stringify({
        action: "get_ctv_list",
        limit,
        offset: pageNum * limit,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const result = Array.isArray(data) ? data[0]?.result : data?.result;
        const newList = result?.ctvData || [];

        if (newList.length < limit) setHasMore(false);

        setCtvData((prev) => {
          const merged = [...prev, ...newList];
          const unique = merged.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.id === item.id)
          );
          return unique;
        });
      })
      .catch((err) => console.error("Lỗi:", err))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className={cx("wrapper")}>
      <h3 className={cx("title")}>Danh sách CTV</h3>
      <ul className={cx("ctv-list")}>
        {ctvData.map((ctv) => (
          <li
            key={ctv.id}
            className={cx("ctv-item", { active: ctv.id === ctvId })}
          >
            <Link
              to={`/chat-manager/${configId}/${ctv.id}`}
              className={cx("ctv-link")}
              onClick={onSelect}
            >
              <img
                src={ctv.avatar}
                alt={ctv.name}
                className={cx("ctv-avatar")}
              />
              <div className={cx("ctv-info")}>
                <span className={cx("ctv-name")}>{ctv.name}</span>
                <span className={cx("ctv-recent-chat")}>{ctv.recentChat}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div style={{ textAlign: "center", padding: 10 }}>
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadCTVs(config?.get_ctv, nextPage);
            }}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #764ba2",
              background: "#764ba2",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isLoading ? "Đang tải..." : "Xem thêm"}
          </button>
        </div>
      )}
    </div>
  );
}

export default CTVList;
