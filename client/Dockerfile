# Step 1: Use an official Node.js runtime as a base image
FROM node:16

# Step 2: Set the working directory in the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json to the container
COPY package*.json ./

# Step 4: Install the app dependencies
RUN npm install

# Step 5: Copy the rest of the application
COPY . .

# Step 6: Run tests inside the Docker container
CMD ["npm", "test"]
