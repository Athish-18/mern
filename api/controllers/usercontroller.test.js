import { test } from "./user.controller.js";

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    // Mocking the request and response objects
    req = {}; // No need to set anything for this simple test
    res = {
      json: jest.fn(), // Mocking the json method of response
    };
  });

  it("should return a working message", () => {
    test(req, res);

    // Verifying if res.json was called with the correct message
    expect(res.json).toHaveBeenCalledWith({
      message: "Api route is working!",
    });
  });
});
