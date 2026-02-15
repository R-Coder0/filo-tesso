import React from "react";
import { createContext, useContext, useState } from "react";

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  return (
    <UIContext.Provider value={{ showCartSidebar, setShowCartSidebar }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
