module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setupEnv.js"],
  globalSetup: "<rootDir>/tests/globalSetup.js",
  clearMocks: true,
};
