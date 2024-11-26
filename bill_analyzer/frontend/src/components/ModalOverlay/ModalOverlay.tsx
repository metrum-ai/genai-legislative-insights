/* Created by Metrum AI for Dell */
import React from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/ModalOverlay.css";

type ModalOverlayProps = {
  closeModal: () => void;
  children: React.ReactNode;
};

const ModalOverlay: React.FC<ModalOverlayProps> = ({
  closeModal,
  children,
}) => {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>
          <FaTimes size={20} />
        </button>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default ModalOverlay;
