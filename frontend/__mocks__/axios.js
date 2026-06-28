const mockApiFn = jest.fn();
const mockAxiosInstance = Object.assign(mockApiFn, {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: { baseURL: "http://test.com/api" },
});

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  post: jest.fn(),
};
mockAxios.default = mockAxios;

module.exports = mockAxios;
