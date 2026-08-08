module.exports = {
  v4: jest.fn(() => "mock-uuid-v4"),
  v7: jest.fn(() => "mock-uuid-v7"),
  validate: jest.fn(() => true),
  parse: jest.fn(() => "mock-uuid-parsed"),
  stringify: jest.fn(() => "mock-uuid-stringified"),
};
