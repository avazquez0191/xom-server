FROM node:18-alpine

WORKDIR /app

# Copy package files first (for caching)
COPY package.json ./
RUN npm install && npm cache clean --force

# Copy the rest of the app
COPY src/ ./src/
COPY tsconfig.json ./
COPY .env ./

# Compiles TS to JS in /dist [Production]
#RUN npm run build

# Start the server # Use "start" for production
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]