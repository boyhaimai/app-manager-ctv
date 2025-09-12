import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "~/App";
import reportWebVitals from "./reportWebVitals";
import GlobalStyles from "~/Components/GlobalStyles/index";
import { ConfigContext } from "./Contexts/ConfigContext";

function Root() {
  const [config, setConfig] = useState(null);

  return (
    <React.StrictMode>
      <GlobalStyles>
        <ConfigContext.Provider value={{ config, setConfig }}>
          <App />
        </ConfigContext.Provider>
      </GlobalStyles>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);

reportWebVitals();
