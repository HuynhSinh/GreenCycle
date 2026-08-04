const friendlyErrorMap = [
  {
    match: ["Unauthorized", "Invalid or expired token"],
    message: "Your session has expired. Please sign in again to continue.",
  },
  {
    match: ["Forbidden"],
    message: "Your account does not have permission to perform this action.",
  },
  {
    match: ["Invalid email or password"],
    message: "The email, username, or password is incorrect. Please check and try again.",
  },
  {
    match: ["Unable to register with provided credentials"],
    message: "This email or username is already in use. Please choose another one.",
  },
  {
    match: ["Customer profile not found"],
    message: "This customer account does not have a profile yet. Please sign out and sign in again so the system can update it.",
  },
  {
    match: ["Evidence image is required"],
    message: "Please take or choose an evidence photo before marking the pickup as collected.",
  },
  {
    match: ["Actual weight is required"],
    message: "Please enter the actual kilograms for every scheduled waste item.",
  },
  {
    match: ["Driver capacity exceeded"],
    message: "This driver does not have enough remaining vehicle capacity. Please choose another driver.",
  },
  {
    match: ["Driver already has an active assignment"],
    message: "This driver already has an assignment at that time. Please choose another driver or adjust the schedule.",
  },
  {
    match: ["Not enough eco-points"],
    message: "You do not have enough Eco-points to redeem this reward.",
  },
  {
    match: ["out of stock"],
    message: "This reward is out of stock. Please choose another reward.",
  },
  {
    match: ["Pickup time must be between", "Scheduled time"],
    message: "Please choose a future pickup time from 08:00 to before 17:00.",
  },
  {
    match: ["Phone number is already used"],
    message: "This phone number is already used by another account. Please enter a different number.",
  },
  {
    match: ["Only pending pickup requests can be"],
    message: "This request has already been processed, so it can no longer be edited or cancelled.",
  },
  {
    match: ["NetworkError", "Failed to fetch", "Request failed"],
    message: "The app could not connect to the server. Please check that the server is running and try again.",
  },
];

const cleanupTechnicalMessage = (message) =>
  String(message || "")
    .replace(/^body\./, "")
    .replace(/^params\./, "")
    .replace(/^query\./, "")
    .replace(/^[a-zA-Z0-9_.]+:\s*/, "")
    .trim();

export function friendlyError(error, fallback = "The action could not be completed. Please try again.") {
  const raw = cleanupTechnicalMessage(error?.message || error || "");

  if (!raw) return fallback;

  const mapped = friendlyErrorMap.find((entry) => entry.match.some((pattern) => raw.includes(pattern)));
  return mapped?.message || raw || fallback;
}

export function successText(message, fallback = "The action was completed successfully.") {
  if (!message) return fallback;

  const raw = String(message);

  if (raw.includes("Pickup request approved")) return "Pickup request approved. You can now assign a driver.";
  if (raw.includes("Pickup scheduled and assigned")) return "Driver assigned to the pickup request.";
  if (raw.includes("Pickup request rejected")) return "Pickup request rejected.";
  if (raw.includes("Pickup request cancelled")) return "Pickup request cancelled. The list has been refreshed.";
  if (raw.includes("Pickup request saved") || raw.includes("created successfully")) {
    return "Pickup request saved. The list has been refreshed.";
  }
  if (raw.includes("Reward exchange request created")) return "Reward redemption request created. Points have been deducted from the wallet.";
  if (raw.includes("Driver approved")) return "Driver approved and activated.";
  if (raw.includes("Driver disabled")) return "Driver disabled.";
  if (raw.includes("Driver updated")) return "Driver status updated.";

  return raw;
}
