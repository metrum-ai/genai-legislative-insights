/* Created by Metrum AI for Dell */
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearUser } from "../../actions/UserSlice";
import { useLogoutUserMutation } from "../../app/api";
import { AppDispatch } from "../../app/store";
import ModalOverlay from "../ModalOverlay/ModalOverlay";

const Logout: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const [logoutUser] = useLogoutUserMutation();

  const handleLogoutClick = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(clearUser());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      handleCloseModal();
    }
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div>
      <div onClick={handleOpenModal} className="logout-div">
        Logout
      </div>

      {showModal && (
        <ModalOverlay closeModal={handleCloseModal}>
          <div className="logout-modal-overlay">
            <div className="logout-modal-container">
              <h2>Are you sure you want to logout?</h2>
              <div className="overlay-actions">
                <button className="secondary-button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button className="primary-button" onClick={handleLogoutClick}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default Logout;
