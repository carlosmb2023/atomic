import { toast as sonnerToast, type Toast as SonnerToast } from "@/components/ui/sonner";

export type ToastProps = SonnerToast;

type ToastFunction = {
  (props: ToastProps | string): void;
  error: (props: ToastProps | string) => void;
  success: (props: ToastProps | string) => void;
  warning: (props: ToastProps | string) => void;
  info: (props: ToastProps | string) => void;
  dismiss: () => void;
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: ToastProps | string;
      success: (data: T) => ToastProps | string;
      error: (error: unknown) => ToastProps | string;
    },
    opts?: {
      id?: string;
    }
  ) => Promise<T>;
};

export const useToast = () => {
  const normalizeProps = (props: ToastProps | string): ToastProps => {
    return typeof props === "string" ? { description: props } : props;
  };

  const toast = ((props: ToastProps | string) => {
    const toastProps = normalizeProps(props);
    return sonnerToast(toastProps);
  }) as ToastFunction;

  toast.error = (props: ToastProps | string) => {
    const toastProps = normalizeProps(props);
    return sonnerToast.error({
      ...toastProps,
      variant: "destructive",
    });
  };

  toast.success = (props: ToastProps | string) => {
    const toastProps = normalizeProps(props);
    return sonnerToast.success(toastProps);
  };

  toast.warning = (props: ToastProps | string) => {
    const toastProps = normalizeProps(props);
    return sonnerToast({
      ...toastProps,
      variant: "warning",
    });
  };

  toast.info = (props: ToastProps | string) => {
    const toastProps = normalizeProps(props);
    return sonnerToast.info(toastProps);
  };

  toast.dismiss = sonnerToast.dismiss;

  toast.promise = async <T>(
    promise: Promise<T>,
    msgs: {
      loading: ToastProps | string;
      success: (data: T) => ToastProps | string;
      error: (error: unknown) => ToastProps | string;
    },
    opts?: {
      id?: string;
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: normalizeProps(msgs.loading),
      success: (data) => normalizeProps(msgs.success(data)),
      error: (error) => normalizeProps(msgs.error(error)),
    }, opts);
  };

  return { toast };
};