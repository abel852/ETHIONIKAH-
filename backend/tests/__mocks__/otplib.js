module.exports = {
  authenticator: {
    generate: jest.fn(() => "123456"),
    generateSecret: jest.fn(() => "MOCK_SECRET"),
    verify: jest.fn(() => true),
    keyuri: jest.fn(() => "otpauth://totp/test"),
  },
};
