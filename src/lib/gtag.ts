
'use client';

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-3XQD83V8Z9';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value?: number;
};

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};


// Custom Events

// --- QR Menu Events ---
export const trackQrScan = (businessId: string, tableNumber: string) => {
  event({ action: 'qr_scan', category: 'QR Menu', label: `Business: ${businessId}, Table: ${tableNumber}` });
};

export const trackMenuItemView = (itemName: string) => {
    event({ action: 'menu_item_view', category: 'QR Menu', label: itemName });
};

export const trackAifaOpen = () => {
  event({ action: 'aifa_opened', category: 'AIFA', label: 'AIFA chat opened' });
};

export const trackAifaMessage = () => {
  event({ action: 'aifa_message_sent', category: 'AIFA', label: 'User sent a message to AIFA' });
};

export const trackWaiterCall = (requestType: string) => {
  const action = requestType === 'Get Bill' ? 'bill_requested' : 'waiter_call';
  event({ action, category: 'Service', label: requestType });
};

export const trackFeedbackSubmission = (rating: number) => {
  event({ action: 'feedback_submitted', category: 'Feedback', label: `Rating: ${rating} stars`, value: rating });
};

export const trackEventRsvp = (eventName: string) => {
  event({ action: 'event_rsvp', category: 'Events', label: eventName });
};


// --- Subscription Events ---
export const trackSubscribeClick = (planName: string) => {
    event({ action: 'subscribe_clicked', category: 'Subscription', label: planName });
};

export const trackCheckoutStart = (planName: string) => {
    event({ action: 'checkout_started', category: 'Subscription', label: planName });
};

export const trackPaymentSuccess = (planName: string, amount: number) => {
    event({ action: 'payment_success', category: 'Subscription', label: planName, value: amount });
};

export const trackPaymentFailure = (planName: string, reason: string) => {
    event({ action: 'payment_failed', category: 'Subscription', label: `Plan: ${planName}, Reason: ${reason}` });
};

// --- Staff Events ---
export const trackStaffQrScan = () => {
    event({ action: 'staff_qr_scanned', category: 'Staff', label: 'Attendance QR scanned' });
};

export const trackStaffLogin = (staffId: string) => {
    event({ action: 'staff_login', category: 'Staff', label: `Staff ID: ${staffId}` });
};

export const trackAttendanceMarked = (staffName: string, status: string) => {
    event({ action: 'attendance_marked', category: 'Staff', label: `Staff: ${staffName}, Status: ${status}` });
};

export const trackSalaryGenerated = () => {
    // This is a placeholder, as the salary generation logic is not yet implemented.
    // When implemented, it would be called from the relevant function.
    event({ action: 'salary_generated', category: 'Staff', label: 'Payroll generation process run' });
};
