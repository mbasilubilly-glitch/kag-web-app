"""
Thin wrapper around Django's stock MySQL backend that lowers the minimum
MariaDB version floor from 10.5 to 10.4.

Django 5.x's stock floor of MariaDB 10.5 is a conservative default, not a
hard requirement for the SQL this project actually generates (standard
models, no advanced JSON/functional-index/CHECK-constraint features that
would need 10.5+). This local XAMPP install runs MariaDB 10.4.32; rather
than downgrade Django globally (this machine has no project-local venv,
so that would affect every other Python project on it) or leave the
project stuck on SQLite, this backend just relaxes that one check.
"""

from django.db.backends.mysql.base import DatabaseWrapper as MySQLDatabaseWrapper
from django.db.backends.mysql.features import DatabaseFeatures as MySQLDatabaseFeatures
from django.utils.functional import cached_property


class DatabaseFeatures(MySQLDatabaseFeatures):
    @cached_property
    def minimum_database_version(self):
        if self.connection.mysql_is_mariadb:
            return (10, 4)
        return super().minimum_database_version

    @cached_property
    def can_return_columns_from_insert(self):
        # Stock Django assumes "is MariaDB" implies ">= 10.5, which added
        # INSERT...RETURNING support" (see django/db/backends/mysql/
        # features.py) because the version-floor check above normally
        # already excludes anything older. Since we lowered that floor to
        # let MariaDB 10.4 through, this needs its own real version check
        # so Django doesn't emit RETURNING against a server that errors on it.
        if self.connection.mysql_is_mariadb:
            return self.connection.mysql_version >= (10, 5)
        return super().can_return_columns_from_insert

    can_return_rows_from_bulk_insert = property(
        lambda self: self.can_return_columns_from_insert
    )


class DatabaseWrapper(MySQLDatabaseWrapper):
    features_class = DatabaseFeatures
