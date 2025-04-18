FROM node:slim

WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Start the server # Use "start" for production
CMD ["npm", "run", "dev"]