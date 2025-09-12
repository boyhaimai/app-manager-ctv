import React from "react";
import classNames from "classnames/bind";

import styles from "./Menu.module.scss";
import { NavLink } from "react-router-dom";

const cx = classNames.bind(styles);

function MenuItem({ title, to, icon, onClick, target }) {
  const isLink = Boolean(to);
  const Component = isLink ? NavLink : "div";
  const className = isLink
    ? (nav) => cx("menu_item", { active: nav.isActive }) // dùng hàm cho NavLink
    : cx("menu_item");
  return (
    <Component
      className={className}
      onClick={onClick}
      to={to}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
    >
      {icon}
      <span className={cx("title")}>{title}</span>
    </Component>
  );
}

export default MenuItem;
