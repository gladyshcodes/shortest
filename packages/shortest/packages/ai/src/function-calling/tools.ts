export const getComputerUse = (
  display_width_px: number,
  display_height_px: number
) => ({
  type: "computer_20241022",
  name: "computer",
  display_width_px,
  display_height_px,
  display_number: 1,
});

export const getGithubLogin = () => ({
  name: "github_login",
  description: "Handle GitHub OAuth login with 2FA",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["github_login"],
        description:
          "The action to perform. It's always equal to 'github_login'",
      },
      username: {
        type: "string",
        description: "GitHub username or email",
      },
      password: {
        type: "string",
        description: "GitHub password",
      },
    },
    required: ["action", "username", "password"],
  },
});

export const getCheckEmail = () => ({
  name: "check_email",
  description: "View received email in new browser tab",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["check_email"],
        description:
          "Check that the email was received with specified content in a new tab",
      },
      email: {
        type: "string",
        description: "The email to check",
      },
    },
    required: ["action", "email"],
  },
});

export const getSleep = () => ({
  name: "sleep",
  description: "Pause test execution for specified duration",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["sleep"],
        description: "The action to perform",
      },
      duration: {
        type: "number",
        description:
          "Duration to sleep in milliseconds (e.g. 5000 for 5 seconds)",
        minimum: 0,
        maximum: 60000,
      },
    },
    required: ["action", "duration"],
  },
});

export const getRunCallback = () => ({
  name: "run_callback",
  description: "Run callback function for current test step",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["run_callback"],
        description: "Execute callback for current step",
      },
    },
    required: ["action"],
  },
});

export const getNavigate = () => ({
  name: "navigate",
  description: "Navigate to URLs in new browser tabs",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["navigate"],
        description: "The action to perform",
      },
      url: {
        type: "string",
        description: "The URL to navigate to",
      },
    },
    required: ["action", "url"],
  },
});
