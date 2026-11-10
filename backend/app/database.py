import os
from sqlmodel import create_engine, Session

# Configurable database URL (defaulting to sqlite:///sessions.db)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///sessions.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def get_session():
    """Dependency to retrieve an active SQLite database session."""
    with Session(engine) as session:
        yield session
