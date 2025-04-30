export default {
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  moduleFileExtensions: ["js", "json", "node"], // Add .js to the list of extensions
  testEnvironment: "node",
};
