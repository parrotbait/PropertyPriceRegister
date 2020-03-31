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

CMD npm run $run_command
#CMD ["echo", "npm run ${run_command}"]
#CMD ["sh", "-c", "npm run ${RUN_COMMAND}"]
