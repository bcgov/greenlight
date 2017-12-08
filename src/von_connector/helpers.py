from datetime import datetime
from uuid import uuid4


def uuid():
    return str(uuid4())


def now():
    datetime.now().strftime("%Y-%m-%d")
