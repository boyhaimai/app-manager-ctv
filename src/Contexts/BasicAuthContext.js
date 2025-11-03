import React, { createContext, useContext, useState } from "react";

const BasicAuthContext = createContext();

export const BasicAuthProvider = ({ children }) => {
  const [basicAuth, setBasicAuth] = useState({
    user: "boyhaimais",
    pass: "bangdz202",
  });

  return (
    <BasicAuthContext.Provider value={{ basicAuth, setBasicAuth }}>
      {children}
    </BasicAuthContext.Provider>
  );
};

export const useBasicAuth = () => useContext(BasicAuthContext);
