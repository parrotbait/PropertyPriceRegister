###############################################################################
# Step 1 : Builder image
#
FROM node:latest

ENV NODE_ENV=production

WORKDIR /app

COPY . .

# Install dependencies and build whatever you have to build 
# (babel, grunt, webpack, etc.)
RUN npm install

# Expose ports (for orchestrators and dynamic reverse proxies)
EXPOSE 5000

CMD [ "npm", "run", "parse", "PPR-ALL.csv" ]

COPY runBingFind.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
entrypoint "/entrypoint.sh"