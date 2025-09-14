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
  const { setConfig } = useConfig(); // 👈 lấy setConfig từ context

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
          // 👇 cập nhật config vào context
          setConfig(result);

          // gọi get_ctv
          return fetch(result.get_ctv, {
            // return fetch(
            //   "https://wf.mkt04.vawayai.com/webhook-test/get-list-ctv",
            //   {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic " + btoa("boyhaimais:bangdz202"),
            },
            body: JSON.stringify({ action: "get_ctv_list" }),
          });
        }
      })
      .then((res) => res?.json())
      .then((data) => {
        // data = [ { result: { ctvData, stats, unreplied, top_ctv, monthly_stats } } ]
        const result = Array.isArray(data) ? data[0]?.result : data?.result;

        if (result?.ctvData) {
          setCtvData(result.ctvData);
        }
      })

      .catch((err) => console.error("Lỗi:", err));
  }, [configId, setConfig]);

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
    </div>
  );
}

export default CTVList;
