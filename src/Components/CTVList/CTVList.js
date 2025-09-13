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
                // src={ctv.avatar}
                src="https://scontent.fhan2-3.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s200x200&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_eui2=AeGxjKmHmpEethSdohcuF97BWt9TLzuBU1Ba31MvO4FTUGKAJ1layeJ0SYNPOMhe-91l7wJKBeGi4_GeaTxz-TPJ&_nc_ohc=7CsbLZRM9FQQ7kNvwH1Y70c&_nc_oc=AdkPJ4G5Y4jPn-lkDZAr2Cv3Wv1mxaYLVHvrdGtFnkxexY8pIrnyoatN3VyvjdBKyNE&_nc_zt=24&_nc_ht=scontent.fhan2-3.fna&oh=00_AfbE1Lo8mCHsGMn8vbGaWodq_uANVoEv2TS4x-VVuSWqDw&oe=68EC4DBA"
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
