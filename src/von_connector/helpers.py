import datetime
from uuid import uuid4
from random import randrange


def uuid():
    return str(uuid4())


def pst():
    return '%d%d%d%d%d %d%d%d%d' % tuple(randrange(10) for i in range(9))


def now():
    return datetime.datetime.now().strftime('%Y-%m-%d')


def one_year():
    return (
      datetime.datetime.now() +
      datetime.timedelta(days=365)).strftime('%Y-%m-%d')
