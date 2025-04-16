# Step 1: Build the React application
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app’s source code
COPY . .

# Build the React application
RUN npm run build

# Step 2: Serve the build with a lightweight server
FROM nginx:alpine

# Copy the build folder from the previous stage to the Nginx directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]