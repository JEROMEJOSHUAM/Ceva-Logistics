# Production extensions (e.g. database connections, redis cache, hashing engines)

class DatabaseConnection:
    def __init__(self):
        self.connected = False

    def connect(self):
        self.connected = True

db_conn = DatabaseConnection()
