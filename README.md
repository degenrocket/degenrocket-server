# DegenRocket server

DegenRocket-server is a backend for a web3 decentralized social media with native support for Degen Messaging Protocol (DMP).

## Server setup

If you don't have any experience at setting up a server, then there is a beginner-friendly guide with scripts for an automated [initial server setup](https://github.com/degenrocket/degenrocket-scripts).


## Postgres database

### Setup

By default, user `postgres` doesn't have a password on Ubuntu, so the backend will fail to connect due to a wrong password and it's generally not a good idea to use a default `postgres` user with superuser privileges for the app. The solution is to create a new user with a password, but without privileges, e.g.:

```
sudo su - postgres
psql
CREATE USER dbuser WITH PASSWORD 'dbuser';
CREATE DATABASE news_database WITH OWNER = dbuser;
exit
exit
```

Note: make sure to use a strong password and add it to `.env`.

```
nano .env
```

Example:

```
POSTGRES_PASSWORD=dbuser
POSTGRES_USER=dbuser
```

To create all tables in a new database, execute the code from `database.sql`.

Note: skip line `CREATE DATABASE news_database;` because we've already created a database in the step above.

```
sudo su - postgres
psql -h localhost -d news_database -U dbuser -p 5432
CREATE TABLE IF NOT EXISTS posts(
id SERIAL NOT NULL,
...
```

Note: table `posts` is not necessary if you disable web2 posts. However, it's suggested to create table `posts` to avoid any errors.

### Tables

Table `posts` contains web2 posts (not signed with any private key), usually fetched from RSS sources.

Table `actions` contains all web3 actions that are signed with a private key.

Table `actions_count` contains the number of reactions received by the target action from other actions on this server.

## Install

```
# update npm
npm install -g npm

# install nvm to manage node versions
# https://github.com/nvm-sh/nvm

# install node v18
nvm install 18

# set node v18 as default
nvm alias default 18

# switch to node v18
nvm use 18

# install packages
npm install
```

## Environment

Create default `.env` file, see example `.env.example`.

```
cp .env.example .env
```

## Test locally

```
npm run dev
```

## Run production

Run with pm2

```
# Install pm2
npm i pm2 -g

# To make sure app starts after reboot
pm2 startup

# Run the app
npm run prod

# Freeze a process list on reboot
pm2 save

# Check processes
pm2 list
```

## RSS

The current git version doesn't include the RSS module. It might be added in the future.

## Troubleshooting

Send a message to `degenrocket` on [Session](https://getsession.org) if you need any help.

