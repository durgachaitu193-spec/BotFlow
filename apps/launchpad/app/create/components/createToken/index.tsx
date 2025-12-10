"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, ArrowRight } from "lucide-react";
import { useUserDetailsContext } from "@/context";
import { useRouter } from "next/navigation";
import queueNotification, {
  NotificationStatus,
} from "@components/QueueNotifications";
import { usePrivy } from "@privy-io/react-auth";
import { createToken } from "../../../../contracts/config/BlockchainServices";

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IFormValues {
  name: string;
  symbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

const CreateToken = ({ isOpen, onClose }: CreateTokenModalProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [showMore, setShowMore] = useState<boolean>(false);

  const [formData, setFormData] = useState<IFormValues>({
    name: "",
    symbol: "",
    description: "",
    twitter: "",
    telegram: "",
    website: "",
  });

  const router = useRouter();
  const { address } = useUserDetailsContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const validateAndSetImage = (file: File) => {
    const fileSize = file.size / 1024 / 1024; // in MB
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (fileSize > 5) {
      queueNotification({
        header: "Image Size Exceeded",
        message: "The image size should not be more than 5MB",
        status: NotificationStatus.WARNING,
      });
      return;
    }

    if (!validTypes.includes(file.type)) {
      queueNotification({
        header: "Unsupported File",
        message: "Upload PNG/JPEG/JPG/WEBP",
        status: NotificationStatus.WARNING,
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { login, authenticated, user } = usePrivy();
  const [pendingSubmission, setPendingSubmission] = useState<boolean>(false);

  const createTokenAction = async () => {
    const { name, symbol, description } = formData;

    if (!name || !symbol || !imageFile) {
      queueNotification({
        header: "Error",
        message: "Please fill all required fields and upload an image",
        status: NotificationStatus.ERROR,
      });
      return;
    }

    try {
      setLoading(true);
      setStatus("Uploading image to IPFS...");

      // Upload image to IPFS via our new endpoint
      const ipfsFormData = new FormData();
      ipfsFormData.append("file", imageFile);
      ipfsFormData.append("tokenName", name);
      ipfsFormData.append("tokenSymbol", symbol);

      const ipfsResponse = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: ipfsFormData,
      });

      if (!ipfsResponse.ok) {
        throw new Error("Failed to upload image to IPFS");
      }

      const { ipfsHash, pinataUrl } = await ipfsResponse.json();

      setStatus("Creating token...");
      await createToken({
        description,
        logo: pinataUrl,
        tokenName: name,
        tokenSymbol: symbol,
        tokenIpfsHash: ipfsHash,
        address: user?.wallet?.address || address,
        network: "bnb",
        twitter: formData.twitter || "",
        telegram: formData.telegram || "",
        website: formData.website || "",
      });

      queueNotification({
        header: "Success",
        message: "Agent Token Created Successfully",
        status: NotificationStatus.SUCCESS,
      });

      onClose();
      router.push("/");
    } catch (error: unknown) {
      console.error(error);
      queueNotification({
        header: "Error",
        message: String(error),
        status: NotificationStatus.ERROR,
      });
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated) {
      setPendingSubmission(true);
      login();
      return;
    }

    await createTokenAction();
  };

  // Auto-submit after login
  React.useEffect(() => {
    if (authenticated && pendingSubmission) {
      setPendingSubmission(false);
      createTokenAction();
    }
  }, [authenticated, pendingSubmission]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-bg-deep p-4 md:p-6 shadow-2xl scrollbar-hide"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      Create Agent Token
                    </h2>
                    <p className="text-sm text-text-muted">
                      Launch your agent on the blockchain
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Image Upload */}
                  <div
                    className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 transition-all hover:border-accent-primary/50 hover:bg-accent-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="relative h-full w-full overflow-hidden rounded-xl">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="text-sm font-medium text-white">
                            Change Image
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-text-muted group-hover:text-accent-primary">
                        <div className="rounded-full bg-white/5 p-3 group-hover:bg-accent-primary/10">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-medium">
                          Click to upload or drag & drop
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">
                        Name
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Agent Smith"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">
                        Symbol
                      </label>
                      <input
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleInputChange}
                        maxLength={8}
                        placeholder="e.g. SMITH"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe your agent..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50 resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowMore(!showMore)}
                      className="flex items-center gap-2 text-xs font-medium text-accent-primary hover:text-accent-primary/80"
                    >
                      {showMore ? "Hide" : "Show"} Social Links
                    </button>

                    <AnimatePresence>
                      {showMore && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-text-secondary">
                              Twitter
                            </label>
                            <input
                              name="twitter"
                              value={formData.twitter}
                              onChange={handleInputChange}
                              placeholder="https://twitter.com/..."
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-text-secondary">
                              Telegram
                            </label>
                            <input
                              name="telegram"
                              value={formData.telegram}
                              onChange={handleInputChange}
                              placeholder="https://t.me/..."
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-text-secondary">
                              Website
                            </label>
                            <input
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              placeholder="https://..."
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !imageFile ||
                        !formData.name ||
                        !formData.symbol
                      }
                      className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-accent-primary py-3 text-sm font-bold text-bg-deep transition-all hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{status || "Creating..."}</span>
                        </>
                      ) : (
                        <>
                          <span>Create Agent Token</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-center text-xs text-text-muted">
                      Cost to Deploy: 0.01 BNB
                    </p>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateToken;
