import datetime
from uuid import uuid4


def uuid():
    return str(uuid4())


def now():
    datetime.datetime.now().strftime("%Y-%m-%d")


def one_year():
    (datetime.datetime.now() + datetime.timedelta(days=365)).strftime("%Y-%m-%d")
