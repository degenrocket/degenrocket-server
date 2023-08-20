# DegenRocket server

DegenRocket-server is a backend for a web3 decentralized social media with native support for Degen Messaging Protocol (DMP).

## Postgres database

### Setup

By default, user `postgres` doesn't have a password on Ubuntu, so the backend will fail to connect due to a wrong password. The solution is to set a new password, e.g.:

```
sudo su - postgres
psql
ALTER USER postgres PASSWORD 'your_password';
```

To create a database with all the tables, execute the code in `database.sql`. 

```
sudo su - postgres
psql
CREATE DATABASE news_database;
...
```

Note: table `posts` is not necessary if you disable web2 posts. However, it's suggested to create table `posts` to avoid any errors.

### Tables

Table `posts` contains web2 posts (not signed with any private key), usually fetched from RSS sources.

Table `actions` contains all web3 actions that are signed with a private key.

Table `actions_count` contains the number of reactions received by the target action from other actions on this server.

## Install

```
npm Install
```

## Environment

Create `.env` file, see example `.env.example`.

## Run

Run using pm2

```
npm run prod
pm2 save
```

## RSS

The current git version doesn't include the RSS module. It might be added in the future.

## Troubleshooting

Send a message to `degenrocket` on [Session](https://getsession.org) if you need any help.

