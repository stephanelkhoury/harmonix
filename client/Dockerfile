# Step 1: Build the React application
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app’s source code and build
COPY . .
RUN npm run build

# Step 2: Serve the build with a lightweight server
FROM nginx:stable-alpine
# Copy the build folder from previous stage to nginx directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 (nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]