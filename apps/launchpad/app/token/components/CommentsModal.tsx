"use client";

import queueNotification, {
  NotificationStatus,
} from "@/ui-components/QueueNotifications";
import Image from "next/image";
import React, { useState, useRef, DragEvent } from "react";
import Modal from "@/ui-components/Modal";

const CommentsModal = ({
  openCommentModal,
  setOpenCommentModal,
  onComment,
  loading,
}: {
  openCommentModal: boolean;
  setOpenCommentModal: React.Dispatch<React.SetStateAction<boolean>>;
  onComment: (message: string, imageFile?: File) => Promise<void>;
  loading: boolean;
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const fileSize = file.size;
    const limit = fileSize / 1024 / 1024 <= 5;
    const isImg =
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/png" ||
      file.type === "image/webp";

    if (!limit) {
      queueNotification({
        header: "Image Size Exceeded",
        message: "The image size should not be more than 5MB",
        status: NotificationStatus.WARNING,
      });
      return false;
    }
    if (!isImg) {
      queueNotification({
        header: "Unsupported File",
        message: "Upload PNG/JPEG/JPG/WEBP",
        status: NotificationStatus.WARNING,
      });
      return false;
    }
    return true;
  };

  const handleFileChange = (file: File | null) => {
    if (file && validateFile(file)) {
      setImageFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!message) return;
    await onComment(message, imageFile || undefined);
  };

  return (
    <Modal
      destroyOnClose
      afterClose={() => {
        setImageFile(null);
        setMessage("");
      }}
      onCancel={() => setOpenCommentModal(false)}
      title={<div>Post a Comment</div>}
      open={openCommentModal}
      footer={null}
    >
      <div className="flex flex-col gap-y-4 p-2">
        {/* Comment Input */}
        <div className="flex flex-col gap-y-2">
          <label className="text-label">
            Add Comment <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            rows={2}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type here"
            className="border border-white rounded-[30px] text-white placeholder:text-placeholder bg-transparent px-4 py-2 resize-none"
          />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-y-2">
          <label className="text-label">Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={loading}
          />

          {imageFile ? (
            <div className="border border-white rounded-[30px] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/assets/dragNdrop.png"
                    alt="file"
                    height={40}
                    width={40}
                  />
                  <span className="text-white text-sm">{imageFile.name}</span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-400 transition-colors"
                  disabled={loading}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[30px] p-4 cursor-pointer transition-colors ${
                isDragging ? "border-secondary bg-secondary/10" : "border-white"
              } ${loading ? "opacity-50 cursor-not-allowed" : "hover:border-secondary"}`}
            >
              <div className="flex items-center gap-x-4 w-full justify-center p-2">
                <Image
                  src="/assets/dragNdrop.png"
                  alt="drag-n-drop"
                  height={53}
                  width={60}
                />
                <div className="flex flex-col items-start">
                  <p className="text-[12px] text-white font-bold mb-1">
                    <span className="text-secondary">Click to upload</span> or
                    Drag and Drop media
                  </p>
                  <div className="text-[10px] text-white text-left">
                    <p>Max. Size: 5MB</p>
                    <p>Supports: PNG, JPG, JPEG, WEBP</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          disabled={!message || loading}
          className={`w-full bg-green_primary border-none outline-none text-black font-bold h-[45px] text-[16px] rounded-lg transition-opacity ${
            !message || loading
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
          onClick={handleSubmit}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </Modal>
  );
};

export default CommentsModal;
