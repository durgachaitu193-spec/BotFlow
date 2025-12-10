"use client";
import { Modal } from "antd";
import React from "react";
import LoginModalContent from "./LoginModalContent";

function LoginModal({
  onClose,
  open,
}: {
  onClose?: () => void;
  open: boolean;
}) {
  return (
    <Modal
      onCancel={onClose}
      title={<div>Login</div>}
      open={open}
      footer={null}
    >
      <LoginModalContent onClose={onClose} />
    </Modal>
  );
}

export default LoginModal;
