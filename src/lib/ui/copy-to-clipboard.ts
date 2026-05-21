import {notifySuccess} from "./white-label-notify";

/** Copy text to the clipboard and show a success toast. */
export async function copyToClipboard(
  text: string,
  successMessage = "Copied to clipboard",
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    notifySuccess(successMessage);
    return;
  } catch {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    notifySuccess(successMessage);
  }
}
