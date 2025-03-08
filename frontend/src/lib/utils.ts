export const maxImageSize = 100 * 1024; // 100kb

export function formatMessageTime(date: number) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const isBase64SizeValid = (base64String: string | null): boolean => {
  if (base64String === null) return false;

  // Calculate the size of the Base64 string in bytes
  const base64SizeInBytes: number = Math.ceil((base64String.length * 3) / 4);
  return base64SizeInBytes <= maxImageSize;
};
