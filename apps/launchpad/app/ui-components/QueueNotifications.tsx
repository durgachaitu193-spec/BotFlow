import { toast } from "sonner";

export enum NotificationStatus {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

interface NotificationProps {
  header: string;
  message: string;
  status: NotificationStatus;
}

const queueNotification = ({ header, message, status }: NotificationProps) => {
  // Map 'warning' to 'warning' (sonner supports it)
  // Map 'info' to 'info'
  // Map 'success' to 'success'
  // Map 'error' to 'error'

  switch (status) {
    case NotificationStatus.SUCCESS:
      toast.success(header, { description: message });
      break;
    case NotificationStatus.ERROR:
      toast.error(header, { description: message });
      break;
    case NotificationStatus.WARNING:
      toast.warning(header, { description: message });
      break;
    case NotificationStatus.INFO:
      toast.info(header, { description: message });
      break;
    default:
      toast(header, { description: message });
      break;
  }
};

export default queueNotification;
