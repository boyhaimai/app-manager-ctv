import React, { useState } from "react";
import noImage from "~/Components/assets/image/noImage.png";
import classNames from "classnames/bind";
import styles from "./Image.module.scss";

const cx = classNames.bind(styles);

function Image({ src, alt, className, ...props }) {
  const [fallback, setFalback] = useState("");
  const handleError = () => {
    setFalback(noImage);
  };
  return (
    <image
      src={fallback || src}
      alt={alt}
      className={cx(styles.wrapper, className)}
      {...props}
      onError={handleError}
    />
  );
}

export default Image;
