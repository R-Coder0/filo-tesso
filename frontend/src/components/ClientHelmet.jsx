import React from "react";
import { Helmet } from "react-helmet-async";

const ClientHelmet = ({ children, helmetKey }) => {
  if (import.meta.env.SSR) return null;

  return <Helmet key={helmetKey}>{children}</Helmet>;
};

export default ClientHelmet;
