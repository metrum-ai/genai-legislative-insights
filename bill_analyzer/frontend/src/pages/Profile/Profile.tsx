/* Created by Metrum AI for Dell */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import DownIcon from "../../assets/svg/down_icon.svg";
import Avatar from "../../assets/svg/user.svg";
import Logout from "../../components/Auth/Logout";
import "../../styles/Profile.css";
const Profile: React.FC = () => {
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null); // Reference for dropdown
  const userName = useSelector(
    (state: RootState) => state.user?.user?.username
  );
  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    };

    if (dropdownVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownVisible]);

  return (
    <div className="user-profile">
      <div className="user-panel" onClick={toggleDropdown}>
        <img
          src={Avatar}
          alt="User Profile"
          title="User Profile"
          className="user-avatar"
        />
        <div className="username">{userName ?? "demo@example.com"}</div>
        <img
          src={DownIcon}
          alt="Dropdown"
          title="dropdown"
          className="down-icon"
        />
      </div>
      {dropdownVisible && (
        <div className="dropdown-menu" ref={dropdownRef}>
          <Logout />
        </div>
      )}
    </div>
  );
};

export default Profile;
