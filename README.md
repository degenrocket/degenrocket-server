# DegenRocket server

DegenRocket-server is a backend for a web3 decentralized social media with native support for Degen Messaging Protocol (DMP).

DegenRocket-web repository can be found [here](https://github.com/degenrocket/degenrocket-web).

## Server setup

If you don't have any experience at setting up a server, then there is a beginner-friendly guide with scripts for an automated [initial server setup](https://github.com/degenrocket/degenrocket-scripts).


## Postgres database

### Setup

By default, user `postgres` doesn't have a password on Ubuntu, so the backend will fail to connect due to a wrong password and it's generally not a good idea to use a default `postgres` user with superuser privileges for the app. The solution is to create a new user with a password, but without privileges, e.g.:

```
sudo su - postgres
psql
CREATE USER dbuser WITH PASSWORD 'dbuser';
CREATE DATABASE spasm_database WITH OWNER = dbuser;
CREATE DATABASE spasm_database_test WITH OWNER = dbuser;
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

Note: skip lines `CREATE DATABASE spasm_database;` and `CREATE DATABASE spasm_database_test;` because we've already created databases in the step above.

```
sudo su - postgres
psql -h localhost -d spasm_database -U dbuser -p 5432
DO $$
BEGIN
    -- V1
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'posts'
    ) THEN
        CREATE TABLE posts (
...
```

Note: table `posts` is not necessary if you disable web2 posts. However, it's suggested to create table `posts` to avoid any errors.

Alternatively, you can use scripts `npm run initialize-db` or `npm run migrate`, which will attempt to create new main and test databases, as well as all the necessary tables and indices.

However, these scripts require a database user to have a privilege to create a new database. If your database user doesn't have that privilege, then you can grant it by executing the following SQL command from a superuser:

```
ALTER USER your_username CREATEDB;
```

Once your database user has a privilege to create new databases, you can run scripts `npm run initialize-db` or `npm run migrate` again.

### Tables

##### Tables V2

Table `spasm_events` contains all signed user-generated events and unsigned web2 posts (RSS).

##### Tables V1

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

---

## Download the app

Download the app from the Github into the `backend/` folder.

*Note: the app should already be downloaded if you've used scripts for an automated [initial server setup](https://github.com/degenrocket/degenrocket-scripts).*

```
git clone https://github.com/degenrocket/degenrocket-server.git backend/
cd backend/
```

---

## Environment

Create default `.env` file, see example `.env.example`.

```
cp .env.example .env
```

## Test locally

Install npm packages in the backend folder.

```
npm install
```

Start the app.

```
npm run dev
```

Open a browser and test API at `localhost:5000/api/events`.

*Note: You should get `null` or empty array `[]` if your database is empty*

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

#### Database permission denied

If you get `permission denied` errors accessing your database like:

```
error: permission denied for table app_configs
error: permission denied for table spasm_events
insertSpasmEventV2 failed error: permission denied for sequence spasm_events_db_key_seq
```

Then execute the following commands:

```
sudo su - postgres
psql
```

```
-- First, grant permissions on all existing sequences
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dbuser;
-- Then, set default permissions for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dbuser;
-- Grant privileges on all sequences in the schema
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO dbuser;
```

## Contact

Send a message to `degenrocket` on [Session](https://getsession.org) if you need any help.

