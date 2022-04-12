# DegenRocket server

DegenRocket-server is a backend for a web3 decentralized social media with native support for Degen Messaging Protocol (DMP).

### Postgres database

By default, user `postgres` doesn't have a password on Ubuntu, so the backend will fail to connect due to a wrong password. The solution is to set a new password, e.g.:

```
sudo su - postgres
psql
ALTER USER postgres PASSWORD 'your_password';
```
