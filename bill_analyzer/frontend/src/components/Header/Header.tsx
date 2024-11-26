/* Created by Metrum AI for Dell */
import { useEffect } from "react";
import LawLogo from "../../assets/img/law_logo.png";
import MetrumLogo from "../../assets/img/metrum_logo_black.png";
import Profile from "../../pages/Profile/Profile";
import "../../styles/Header.css"; // Import the CSS file
import {
  BRAND_LOGO,
  DASHBOARD_LOGO,
  DASHBOARD_SUBTITLE,
  DASHBOARD_TITLE,
} from "../../utils/constants";
import { restoreFields } from "../../utils/helpers";

const Header = () => {
  const resetSessionStorage = () => {
    sessionStorage.setItem("brandLogo", BRAND_LOGO);
    sessionStorage.setItem("dashboardLogo", DASHBOARD_LOGO);
    sessionStorage.setItem("dashboardTitle", DASHBOARD_TITLE);
    sessionStorage.setItem("dashboardSubtitle", DASHBOARD_SUBTITLE);
  };

  useEffect(() => {
    restoreFields();
    window.addEventListener("beforeunload", resetSessionStorage);

    return () => {
      window.removeEventListener("beforeunload", resetSessionStorage);
    };
  }, []);

  return (
    <div className="header-container">
      <img src={MetrumLogo as string} alt="brandName" className="header-logo" />
      <img src={LawLogo} alt="" className="header-content" />
      <div className="personalize-trigger">
        <Profile />
        <button className="secondary-button">Personalize </button>
      </div>
    </div>
  );
};

export default Header;
