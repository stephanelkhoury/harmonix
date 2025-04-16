FROM node:16-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app’s source code.
COPY . .

# Expose the port your server runs on (e.g., 5000)
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]