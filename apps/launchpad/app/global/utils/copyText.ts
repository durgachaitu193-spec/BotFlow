import queueNotification, {
  NotificationStatus,
} from "@/ui-components/QueueNotifications";

const showMessage = (): void => {
  queueNotification({
    header: "Success",
    message: "Copied!",
    status: NotificationStatus.SUCCESS,
  });
};

export default function copyText(text: string) {
  navigator.clipboard.writeText(`${text}`);
  showMessage();
}
