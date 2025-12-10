import { useUserDetailsContext } from "@/context";
import { nextApiFetch } from "@/global/utils/nextApiFetch";
import { uploadImage } from "@/global/utils/uploadImage";
import Address from "@/ui-components/Address";
import Loader from "@/ui-components/Loader";
import queueNotification, {
  NotificationStatus,
} from "@/ui-components/QueueNotifications";
import SecondaryButton from "@/ui-components/SecondaryButton";
// import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from "react";
import CommentsModal from "./CommentsModal";

const Comments = ({ tokenId }: { tokenId: string }) => {
  const { address } = useUserDetailsContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comments, setComments] = useState<any[]>([]);

  const [openCommentModal, setOpenCommentModal] = useState<boolean>(false);

  const fetchComments = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    const { data, error } = await nextApiFetch({
      url: "api/v1/get/comments",
      method: "POST",
      data: {
        address,
        signature:
          (typeof window !== "undefined" &&
            localStorage.getItem("signature")) ||
          "",
        tokenId,
      },
    });
    setLoading(false);
    if (data && !error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComments((data as any).comments);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // const handleImageChange = (e: any) => {
  //     const file = e.file;
  //     setImageFile(file);
  // };

  const createComment = async (message: string, imageFile?: File) => {
    if (!message) return;
    setCreateLoading(true);

    let imageURL = "";
    if (imageFile) {
      imageURL = await uploadImage(imageFile);
    }
    const { data, error } = await nextApiFetch({
      url: "api/v1/create/comments",
      method: "POST",
      data: {
        address,
        signature:
          typeof window !== "undefined" && localStorage.getItem("signature"),
        tokenId,
        img: imageURL,
        message,
      },
    });
    setCreateLoading(false);

    if (data && !error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comment = (data as any).comment;
      setComments((prev) => [comment, ...prev]);
      setOpenCommentModal(false);
      queueNotification({
        header: "Success",
        message: "Comment Posted",
        status: NotificationStatus.SUCCESS,
      });
    } else {
      queueNotification({
        header: "Failed",
        message: error || "There was some error while posting your comment",
        status: NotificationStatus.ERROR,
      });
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <CommentsModal
        openCommentModal={openCommentModal}
        setOpenCommentModal={setOpenCommentModal}
        loading={createLoading}
        onComment={createComment}
      />
      {!comments || comments?.length === 0 ? (
        <div className="flex justify-center">No Comments</div>
      ) : (
        <div className="flex flex-col gap-y-2">
          {comments.map((item, i) => (
            <div key={i} className="rounded-[12px] p-3 bg-bg_primary">
              <div className="flex gap-x-2 mb-2">
                <Address address={item.address} startChars={4} endChars={4} />
              </div>
              <div className="flex gap-x-2 font-bold">
                {item.img && (
                  <img
                    src={item.img}
                    height={100}
                    width={100}
                    className="h-[100px] w-[100px]"
                    alt="comment image"
                  />
                )}
                <span className="break-all">{item.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center mt-2">
        <SecondaryButton onClick={() => setOpenCommentModal(true)}>
          Post a Comment
        </SecondaryButton>
      </div>
    </div>
  );
};

export default Comments;
