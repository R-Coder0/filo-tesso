import { toast } from "react-hot-toast";

export const showToastConfirm = ({
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmClassName = "bg-gray-950 hover:bg-gray-800",
  onConfirm,
}) => {
  toast(
    (t) => (
      <div className="w-[280px] max-w-[80vw]">
        <p className="text-sm font-semibold text-gray-950">{title}</p>
        {message && <p className="mt-1 text-xs text-gray-600">{message}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm?.();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${confirmClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    { duration: 8000 }
  );
};
