# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the desired port
EXPOSE 3001

# Set environment variable for Next.js to listen on port 3001
ENV PORT=3001

# Build the Next.js app (if using Next.js)
RUN npm run build

# Start the app
CMD ["npm", "start"]
