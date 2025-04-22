FROM node:slim

WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Compiles TS to JS in /dist [Production]
#RUN npm run build

# Start the server # Use "start" for production
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]