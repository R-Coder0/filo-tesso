import React, { createContext, useContext } from "react";

const SsrDataContext = createContext({});

const getBrowserSsrData = () => {
  if (typeof window === "undefined") return {};
  return window.__SSR_DATA__ || {};
};

export const SsrDataProvider = ({ data, children }) => (
  <SsrDataContext.Provider value={data || getBrowserSsrData()}>
    {children}
  </SsrDataContext.Provider>
);

export const useSsrData = (key) => {
  const data = useContext(SsrDataContext);
  return data?.[key];
};

