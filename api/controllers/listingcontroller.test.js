import { createListing } from "../controllers/listing.controller.js";
import Listing from "../models/listing.model.js";

// Mock the necessary modules
jest.mock("../models/listing.model.js");

describe("Listing Controller", () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request, response, and next
    req = {
      body: { name: "Listing 1", price: 100 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should create a listing successfully", async () => {
    // Mocking Listing.create method
    Listing.create.mockResolvedValue(req.body);

    await createListing(req, res, next);

    expect(Listing.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });

  test("should return error if listing creation fails", async () => {
    // Simulating error
    Listing.create.mockRejectedValue(new Error("Error creating listing"));

    await createListing(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
