# MongoDB Setup Options

You have two options for setting up MongoDB for the Harmonix application:

## Option 1: MongoDB Atlas (Cloud-based)

MongoDB Atlas is a cloud-based database service that eliminates the need to install and manage MongoDB locally.

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas account**:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Create a new organization if prompted

2. **Create a new project**:
   - Name it "Harmonix" or another name of your choice

3. **Build a database**:
   - Click "Build a Database"
   - Select the free tier (M0) 
   - Choose a cloud provider and region closest to you
   - Name your cluster (e.g., "harmonix-cluster")

4. **Set up database security**:
   - Create a database user (remember username and password)
   - Add your IP address to the IP access list or allow access from anywhere (0.0.0.0/0) for development

5. **Get your connection string**:
   - From the cluster view, click "Connect"
   - Select "Connect your application"
   - Choose "Node.js" as your driver
   - Copy the connection string

6. **Update your .env files**:
   - Replace the placeholder connection string in both:
     - `/backend/.env`
     - `/server/.env`
   - Example format: `mongodb+srv://username:password@cluster0.example.mongodb.net/harmonix?retryWrites=true&w=majority`
   - Replace `username`, `password`, and the rest with your actual connection details

Note: For production environments, limit IP access and use proper security practices.

## Option 2: Local MongoDB Installation

If you prefer to run MongoDB locally:

1. **Install MongoDB Community Edition**:
   
   For macOS:
   ```bash
   # Using Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   ```
   
   For other platforms, see [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB locally**:
   ```bash
   # Start MongoDB as a service
   brew services start mongodb-community
   
   # Or start MongoDB manually (from project root)
   mkdir -p data/db
   mongod --dbpath ./data/db
   ```

3. **Use the local connection string**:
   - Make sure your .env files have the following settings:
     - In `/backend/.env`: `MONGODB_URI=mongodb://localhost:27017/harmonix`
     - In `/server/.env`: `MONGO_URL=mongodb://localhost:27017/harmonix` 

The `start_local.sh` script will try to start a local MongoDB instance if needed and will check if your database connection is properly configured.
