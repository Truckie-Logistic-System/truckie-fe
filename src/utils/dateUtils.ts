import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm');
};

export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
};

export const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Ho_Chi_Minh').format('HH:mm');
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
};

/**
 * Format date to Vietnam timezone (UTC+7) with format YYYY-MM-DDTHH:mm:ss
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatToVietnamTime = (date: Date): string => {
  // Chuyển về UTC+7 (múi giờ Việt Nam)
  const utc7Offset = 7 * 60; // UTC+7 = 7 hours * 60 minutes
  const localOffset = date.getTimezoneOffset(); // minutes
  const vietnamTime = new Date(
    date.getTime() + (utc7Offset + localOffset) * 60000
  );

  // Format: YYYY-MM-DDTHH:mm:ss
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
  const day = String(vietnamTime.getDate()).padStart(2, "0");
  const hours = String(vietnamTime.getHours()).padStart(2, "0");
  const minutes = String(vietnamTime.getMinutes()).padStart(2, "0");
  const seconds = String(vietnamTime.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Get current Vietnam time formatted as YYYY-MM-DDTHH:mm:ss
 * @returns Current Vietnam time string
 */
export const getCurrentVietnamTime = (): string => {
  return formatToVietnamTime(new Date());
};

/**
 * Get tomorrow Vietnam time formatted as YYYY-MM-DDTHH:mm:ss
 * @returns Tomorrow Vietnam time string
 */
export const getTomorrowVietnamTime = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatToVietnamTime(tomorrow);
};
