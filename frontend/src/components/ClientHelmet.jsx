import React from "react";
import { Helmet } from "react-helmet-async";

const ClientHelmet = ({ children }) => {
  if (import.meta.env.SSR) return null;

  return <Helmet>{children}</Helmet>;
};

export default ClientHelmet;
