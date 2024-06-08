# Select slim version
FROM node:lts-bookworm-slim

#  Optimize Node.js tooling for production
ENV NODE_ENV production


# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Bundle rest of the source code
COPY . .

CMD [ "node", "src/index.js" ]
