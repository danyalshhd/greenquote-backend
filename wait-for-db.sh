#!/bin/sh
# wait-for-db.sh

set -e

host="$1"
shift
cmd="$@"

echo "Waiting for database at $host..."

until pg_isready -h "$host" -p 5432 -U "postgres"; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Postgres is up - executing command"
exec $cmd
