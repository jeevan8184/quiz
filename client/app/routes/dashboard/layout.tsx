import React from "react";
import { Outlet } from "react-router-dom";
import Dashboard from "~/components/dashboard";

const DashboardWrapper = () => (
  <Dashboard>
    <Outlet />
  </Dashboard>
);

export default DashboardWrapper;
