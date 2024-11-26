/* Created by Metrum AI for Dell */
import {
  BRAND_LOGO,
  DASHBOARD_LOGO,
  DASHBOARD_SUBTITLE,
  DASHBOARD_TITLE,
} from "./constants";

export const convertTime = (unixTime: number): string => {
  return new Date(unixTime * 1000).toLocaleString();
};

export const restoreFields = () => {
  if (!sessionStorage.getItem("brandLogo")) {
    sessionStorage.setItem("brandLogo", BRAND_LOGO);
  }
  if (!sessionStorage.getItem("dashboardLogo")) {
    sessionStorage.setItem("dashboardLogo", DASHBOARD_LOGO);
  }
  if (!sessionStorage.getItem("dashboardTitle")) {
    sessionStorage.setItem("dashboardTitle", DASHBOARD_TITLE);
  }
  if (!sessionStorage.getItem("dashboardSubtitle")) {
    sessionStorage.setItem("dashboardSubtitle", DASHBOARD_SUBTITLE);
  }
};
